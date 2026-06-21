import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Classification, CounterpartyType, TransactionSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationEngine } from '../classification/classification.engine';
import { AlertsEngine } from '../alerts/alerts.engine';
import {
  CreateTransactionDto,
  OverrideClassificationDto,
  BulkClassifyDto,
  ResolveReviewFlagDto,
} from './dto/create-transaction.dto';
import Decimal from 'decimal.js';
import { createHash } from 'crypto';

function stripFormulaChars(value: string): string {
  return value.replace(/^[=+\-@\t\r]+/, '').trim();
}

interface PaginationParams {
  page: number;
  limit: number;
  classification?: Classification;
  startDate?: string;
  endDate?: string;
  search?: string;
  requiresReview?: boolean;
}

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classifier: ClassificationEngine,
    private readonly alertsEngine: AlertsEngine,
  ) {}

  async createTransaction(
    orgId: string,
    taxPeriodId: string,
    dto: CreateTransactionDto,
    actorId: string,
  ) {
    if (!taxPeriodId) {
      throw new BadRequestException('taxPeriodId is required');
    }

    // Validate tax period belongs to org and is OPEN
    const period = await this.prisma.taxPeriod.findFirst({
      where: { id: taxPeriodId, orgId, status: 'OPEN' },
    });

    if (!period) {
      throw new BadRequestException('Tax period not found or is locked/filed');
    }

    // Validate date is within period
    const txDate = new Date(dto.date);
    if (txDate < period.startDate || txDate > period.endDate) {
      // Allow up to 13 months prior per data validation rules
      const thirteenMonthsAgo = new Date(period.startDate);
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
      if (txDate < thirteenMonthsAgo) {
        throw new BadRequestException(
          `Transaction date ${dto.date} is outside the valid range for this period`,
        );
      }
    }

    // Credit note must link to an original transaction
    if (dto.isCreditNote) {
      if (dto.amountAed > 0) {
        throw new BadRequestException('Credit note amount must be negative');
      }
      if (!dto.linkedTransactionId) {
        throw new BadRequestException('Credit notes must reference the original transaction');
      }
      const original = await this.prisma.revenueTransaction.findFirst({
        where: { id: dto.linkedTransactionId, orgId },
      });
      if (!original) {
        throw new NotFoundException('Linked transaction not found');
      }
    }

    // Validate activity code exists
    if (dto.activityCode) {
      const activity = await this.prisma.activityCatalog.findUnique({
        where: { code: dto.activityCode },
      });
      if (!activity) {
        throw new BadRequestException(`Invalid activity code: ${dto.activityCode}`);
      }
    }

    // Classify the transaction
    const classificationResult = dto.activityCode
      ? this.classifier.classify({
          activityCode: dto.activityCode,
          counterpartyType: dto.counterpartyType,
          amountAed: Math.abs(dto.amountAed),
          counterpartyName: dto.counterparty,
          isRelatedParty: dto.isRelatedParty ?? dto.counterpartyType === CounterpartyType.RELATED,
          isDesignatedZone: dto.isDesignatedZone,
          description: dto.description,
        })
      : null;

    const source = dto.source ?? TransactionSource.MANUAL;

    // Generate a deterministic externalId for MANUAL transactions so the unique
    // (orgId, source, externalId) constraint prevents duplicates on retry.
    // For CSV/integration sources, the caller supplies externalId from the upstream system.
    const externalId =
      dto.externalId ??
      (source === TransactionSource.MANUAL
        ? createHash('sha256')
            .update(`${orgId}:${dto.date}:${dto.amountAed}:${dto.counterparty}:${dto.invoiceNo ?? ''}`)
            .digest('hex')
            .slice(0, 32)
        : undefined);

    const transaction = await this.prisma.revenueTransaction.create({
      data: {
        orgId,
        taxPeriodId,
        externalId,
        date: new Date(dto.date),
        amountAed: new Decimal(dto.amountAed),
        currency: dto.currency ?? 'AED',
        fxRateToAed: dto.fxRateToAed ? new Decimal(dto.fxRateToAed) : null,
        counterparty: dto.counterparty || 'UNKNOWN',
        counterpartyType: dto.counterpartyType,
        activityCode: dto.activityCode,
        classification: classificationResult?.classification ?? Classification.UNCLASSIFIED,
        confidence: classificationResult?.confidence ?? 0,
        source,
        invoiceNo: dto.invoiceNo,
        description: dto.description,
        isCreditNote: dto.isCreditNote ?? false,
        linkedTransactionId: dto.linkedTransactionId,
        isDeferred: dto.isDeferred ?? false,
        requiresReview: classificationResult?.requiresReview ?? true,
      },
      include: { activityCatalog: true },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'CREATE_TRANSACTION',
        entity: 'RevenueTransaction',
        entityId: transaction.id,
        afterJson: { classification: transaction.classification, amountAed: dto.amountAed },
      },
    });

    // Trigger large NQI alert
    if (
      transaction.classification === Classification.NQI &&
      Math.abs(dto.amountAed) > 500_000
    ) {
      await this.alertsEngine.evaluateLargeNqiAlert(
        orgId,
        transaction.id,
        Math.abs(dto.amountAed),
      );
    }

    return transaction;
  }

  async overrideClassification(
    transactionId: string,
    orgId: string,
    actorId: string,
    dto: OverrideClassificationDto,
    afterPeriodLock = false,
  ) {
    const transaction = await this.prisma.revenueTransaction.findFirst({
      where: { id: transactionId, orgId, isDeleted: false },
      include: { taxPeriod: true },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    // LOCKED and FILED periods require the explicit afterPeriodLock flag
    if (['LOCKED', 'FILED'].includes(transaction.taxPeriod.status) && !afterPeriodLock) {
      throw new ForbiddenException(
        'Cannot override classification in a locked or filed period without the afterPeriodLock flag',
      );
    }

    const validation = this.classifier.validateOverride(
      transaction.classification,
      dto.newClassification as Classification,
      dto.reasonCode,
      dto.reasonText,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.warnings.join('; '));
    }

    const previousClassification = transaction.classification;

    const [updatedTx, override] = await this.prisma.$transaction([
      this.prisma.revenueTransaction.update({
        where: { id: transactionId },
        data: {
          classification: dto.newClassification as Classification,
          confidence: 100, // Manual override = max confidence
          requiresReview: false,
        },
      }),
      this.prisma.classificationOverride.create({
        data: {
          transactionId,
          orgId,
          previousClassification,
          newClassification: dto.newClassification as Classification,
          reasonCode: dto.reasonCode,
          reasonText: dto.reasonText,
          overriddenByUserId: actorId,
          afterPeriodLock,
          requiresAcknowledgment: afterPeriodLock,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          orgId,
          actorId,
          action: 'OVERRIDE_CLASSIFICATION',
          entity: 'RevenueTransaction',
          entityId: transactionId,
          beforeJson: { classification: previousClassification },
          afterJson: {
            classification: dto.newClassification,
            reasonCode: dto.reasonCode,
            reasonText: dto.reasonText,
          },
        },
      }),
    ]);

    return { transaction: updatedTx, override };
  }

  async getTransactions(
    orgId: string,
    taxPeriodId: string,
    params: PaginationParams,
  ) {
    if (!taxPeriodId) {
      throw new BadRequestException('taxPeriodId is required to scope transactions');
    }

    const { page = 1, limit = 50, classification, startDate, endDate, search, requiresReview } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      orgId,
      taxPeriodId,
      isDeleted: false,
    };

    if (classification) where.classification = classification;
    if (requiresReview !== undefined) where.requiresReview = requiresReview;
    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }
    if (search) {
      where.OR = [
        { counterparty: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, transactions] = await Promise.all([
      this.prisma.revenueTransaction.count({ where }),
      this.prisma.revenueTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          activityCatalog: { select: { code: true, name: true } },
          overrides: {
            select: { id: true, newClassification: true, reasonCode: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async softDeleteTransaction(
    transactionId: string,
    orgId: string,
    actorId: string,
  ): Promise<void> {
    const transaction = await this.prisma.revenueTransaction.findFirst({
      where: { id: transactionId, orgId, isDeleted: false },
      include: { taxPeriod: true },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.taxPeriod.status !== 'OPEN') {
      throw new ForbiddenException('Cannot delete transactions in a locked or filed period');
    }

    await this.prisma.$transaction([
      this.prisma.revenueTransaction.update({
        where: { id: transactionId },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          orgId,
          actorId,
          action: 'SOFT_DELETE_TRANSACTION',
          entity: 'RevenueTransaction',
          entityId: transactionId,
          beforeJson: {
            classification: transaction.classification,
            amountAed: transaction.amountAed.toString(),
          },
        },
      }),
    ]);
  }

  async processCsvImport(
    orgId: string,
    taxPeriodId: string,
    rows: Array<Record<string, string>>,
    actorId: string,
  ): Promise<{ imported: number; errors: Array<{ row: number; error: string }> }> {
    if (!taxPeriodId) {
      throw new BadRequestException('taxPeriodId is required for CSV import');
    }

    const period = await this.prisma.taxPeriod.findFirst({
      where: { id: taxPeriodId, orgId, status: 'OPEN' },
    });

    if (!period) throw new BadRequestException('Tax period not found or locked');

    const errors: Array<{ row: number; error: string }> = [];
    const validRows: Array<Omit<CreateTransactionDto, 'amountAed'> & { amountAed: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed, +1 for header

      // Required field validation
      if (!row.date) { errors.push({ row: rowNum, error: 'Missing date' }); continue; }
      if (!row.amount_aed) { errors.push({ row: rowNum, error: 'Missing amount_aed' }); continue; }
      if (!row.counterparty) { errors.push({ row: rowNum, error: 'Missing counterparty' }); continue; }

      let decimalAmount: Decimal;
      try {
        decimalAmount = new Decimal(row.amount_aed);
      } catch {
        errors.push({ row: rowNum, error: 'Invalid amount_aed' }); continue;
      }
      if (decimalAmount.isZero()) { errors.push({ row: rowNum, error: 'Amount cannot be zero' }); continue; }

      const dateVal = new Date(row.date);
      if (isNaN(dateVal.getTime())) { errors.push({ row: rowNum, error: 'Invalid date format' }); continue; }

      validRows.push({
        date: row.date,
        amountAed: row.amount_aed,
        counterparty: stripFormulaChars(row.counterparty),
        counterpartyType: (row.counterparty_type as CounterpartyType) || CounterpartyType.THIRD_PARTY,
        activityCode: row.activity_code || undefined,
        invoiceNo: row.invoice_no ? stripFormulaChars(row.invoice_no) : undefined,
        description: row.description ? stripFormulaChars(row.description) : undefined,
        source: TransactionSource.CSV,
        isCreditNote: row.is_credit_note === 'true',
        isRelatedParty: row.is_related_party === 'true',
        currency: row.currency || 'AED',
      });
    }

    // Classify all valid rows in-process (synchronous), then batch-insert into the DB.
    // This avoids N sequential round-trips and keeps the import within the HTTP timeout.
    const toInsert = validRows.map((row) => {
      const source = TransactionSource.CSV;
      const classificationResult = row.activityCode
        ? this.classifier.classify({
            activityCode: row.activityCode,
            counterpartyType: row.counterpartyType ?? CounterpartyType.THIRD_PARTY,
          amountAed: new Decimal(row.amountAed).abs().toNumber(),
            counterpartyName: row.counterparty,
            isRelatedParty: row.isRelatedParty ?? false,
          })
        : null;

      // Deterministic externalId for idempotency on re-upload of same CSV
      const externalId = createHash('sha256')
        .update(`${orgId}:${row.date}:${row.amountAed}:${row.counterparty}:${row.invoiceNo ?? ''}`)
        .digest('hex')
        .slice(0, 32);

      return {
        orgId,
        taxPeriodId,
        externalId,
        date: new Date(row.date),
        amountAed: new Decimal(row.amountAed),
        currency: row.currency ?? 'AED',
        fxRateToAed: new Decimal(1),
        counterparty: row.counterparty || 'UNKNOWN',
        counterpartyType: row.counterpartyType ?? CounterpartyType.THIRD_PARTY,
        activityCode: row.activityCode ?? null,
        classification: classificationResult?.classification ?? Classification.UNCLASSIFIED,
        confidence: classificationResult?.confidence ?? 0,
        source,
        invoiceNo: row.invoiceNo ?? null,
        description: row.description ?? null,
        isCreditNote: row.isCreditNote ?? false,
        isDeferred: false,
        requiresReview: classificationResult?.requiresReview ?? true,
      };
    });

    // createMany skips duplicates via skipDuplicates — safe for re-uploads of the same CSV
    const result = await this.prisma.revenueTransaction.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'CSV_IMPORT',
        entity: 'RevenueTransaction',
        entityId: taxPeriodId,
        afterJson: { imported: result.count, total: validRows.length, errors: errors.length },
      },
    });

    return { imported: result.count, errors };
  }

  async bulkClassify(
    orgId: string,
    userId: string,
    dto: BulkClassifyDto,
  ): Promise<{ updated: number; errors: string[] }> {
    const { transactionIds, classification, reasonCode, reasonText } = dto;

    // Fetch all requested transactions scoped to this org (non-deleted)
    const existing = await this.prisma.revenueTransaction.findMany({
      where: { id: { in: transactionIds }, orgId, isDeleted: false },
      select: { id: true, classification: true },
    });

    const foundIds = new Set(existing.map((t) => t.id));
    const errors: string[] = [];

    // Report any IDs that were not found or belong to another org
    for (const id of transactionIds) {
      if (!foundIds.has(id)) {
        errors.push(`Transaction ${id}: not found or already deleted`);
      }
    }

    const validTransactions = existing;
    if (validTransactions.length === 0) {
      return { updated: 0, errors };
    }

    // Build atomic operations for all valid transactions
    const operations = validTransactions.flatMap((tx) => [
      this.prisma.revenueTransaction.update({
        where: { id: tx.id },
        data: {
          classification,
          confidence: 100,
          requiresReview: false,
        },
      }),
      this.prisma.classificationOverride.create({
        data: {
          transactionId: tx.id,
          orgId,
          previousClassification: tx.classification,
          newClassification: classification,
          reasonCode,
          reasonText,
          overriddenByUserId: userId,
          afterPeriodLock: false,
          requiresAcknowledgment: false,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          orgId,
          actorId: userId,
          action: 'BULK_CLASSIFY',
          entity: 'RevenueTransaction',
          entityId: tx.id,
          beforeJson: { classification: tx.classification },
          afterJson: { classification, reasonCode, reasonText },
        },
      }),
    ]);

    try {
      await this.prisma.$transaction(operations);
    } catch (err) {
      // If the atomic batch fails entirely, report it
      this.logger.error('bulkClassify transaction failed', err);
      throw new BadRequestException(
        `Bulk classification failed: ${(err as Error).message}`,
      );
    }

    return { updated: validTransactions.length, errors };
  }

  async reclassifyAll(
    orgId: string,
    userId: string,
    taxPeriodId: string,
  ): Promise<{ reclassified: number; unchanged: number }> {
    // Verify the period exists, belongs to org, and is OPEN
    const period = await this.prisma.taxPeriod.findFirst({
      where: { id: taxPeriodId, orgId },
    });

    if (!period) {
      throw new NotFoundException('Tax period not found');
    }

    if (period.status === 'LOCKED' || period.status === 'FILED') {
      throw new BadRequestException(
        'Cannot reclassify transactions in a locked or filed period',
      );
    }

    // Fetch all non-deleted transactions for the period that do NOT have existing overrides
    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        orgId,
        taxPeriodId,
        isDeleted: false,
        overrides: { none: {} },
      },
      select: {
        id: true,
        activityCode: true,
        counterpartyType: true,
        amountAed: true,
        counterparty: true,
        classification: true,
        confidence: true,
        description: true,
      },
    });

    if (transactions.length === 0) {
      return { reclassified: 0, unchanged: 0 };
    }

    let reclassified = 0;
    let unchanged = 0;
    const updates: ReturnType<typeof this.prisma.revenueTransaction.update>[] = [];

    for (const tx of transactions) {
      if (!tx.activityCode) {
        // No activity code — cannot classify; leave as-is
        unchanged++;
        continue;
      }

      const result = this.classifier.classify({
        activityCode: tx.activityCode,
        counterpartyType: tx.counterpartyType,
        amountAed: new Decimal(tx.amountAed).abs().toNumber(),
        counterpartyName: tx.counterparty,
        isRelatedParty: tx.counterpartyType === CounterpartyType.RELATED,
        description: tx.description ?? undefined,
      });

      if (
        result.classification === tx.classification &&
        result.confidence === tx.confidence
      ) {
        unchanged++;
        continue;
      }

      reclassified++;
      updates.push(
        this.prisma.revenueTransaction.update({
          where: { id: tx.id },
          data: {
            classification: result.classification,
            confidence: result.confidence,
            requiresReview: result.requiresReview,
          },
        }),
      );
    }

    if (updates.length > 0) {
      // Prisma $transaction accepts up to ~65k operations; 200-item batches are safe
      await this.prisma.$transaction([
        ...updates,
        this.prisma.auditLog.create({
          data: {
            orgId,
            actorId: userId,
            action: 'RECLASSIFY_ALL',
            entity: 'TaxPeriod',
            entityId: taxPeriodId,
            afterJson: { reclassified, unchanged, total: transactions.length },
          },
        }),
      ]);
    }

    return { reclassified, unchanged };
  }

  async getReviewQueue(
    orgId: string,
    taxPeriodId: string | undefined,
    page: number,
    limit: number,
  ) {
    const where: Record<string, unknown> = {
      orgId,
      requiresReview: true,
      isDeleted: false,
    };

    if (taxPeriodId) {
      where.taxPeriodId = taxPeriodId;
    }

    const [total, transactions] = await Promise.all([
      this.prisma.revenueTransaction.count({ where }),
      this.prisma.revenueTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          activityCatalog: { select: { code: true, name: true } },
          overrides: {
            select: { id: true, newClassification: true, reasonCode: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async resolveReviewFlag(
    orgId: string,
    userId: string,
    transactionId: string,
    dto: ResolveReviewFlagDto,
  ) {
    const transaction = await this.prisma.revenueTransaction.findFirst({
      where: { id: transactionId, orgId, isDeleted: false },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.revenueTransaction.update({
        where: { id: transactionId },
        data: {
          requiresReview: dto.resolved ? false : transaction.requiresReview,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          orgId,
          actorId: userId,
          action: 'REVIEW_FLAG_RESOLVED',
          entity: 'RevenueTransaction',
          entityId: transactionId,
          beforeJson: { requiresReview: transaction.requiresReview },
          afterJson: {
            requiresReview: dto.resolved ? false : transaction.requiresReview,
            resolved: dto.resolved,
            ...(dto.note ? { note: dto.note } : {}),
          },
        },
      }),
    ]);

    return updated;
  }
}
