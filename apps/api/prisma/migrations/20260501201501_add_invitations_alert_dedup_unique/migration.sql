-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'FINANCE', 'VIEWER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "CounterpartyType" AS ENUM ('THIRD_PARTY', 'RELATED');

-- CreateEnum
CREATE TYPE "Classification" AS ENUM ('QI', 'NQI', 'EXCLUDED', 'UNCLASSIFIED');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'ZOHO', 'XERO', 'QUICKBOOKS', 'CSV');

-- CreateEnum
CREATE TYPE "TaxPeriodStatus" AS ENUM ('OPEN', 'LOCKED', 'FILED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'AMBER', 'RED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'EXPIRING_SOON', 'DELETED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('ZOHO', 'XERO', 'QUICKBOOKS', 'MANUAL');

-- CreateEnum
CREATE TYPE "FreeZone" AS ENUM ('DMCC', 'JAFZA', 'IFZA', 'DIFC', 'ADGM', 'RAKEZ', 'DWC', 'SHAMS', 'MEYDAN', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PAUSED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeLicenseNo" TEXT NOT NULL,
    "freeZone" "FreeZone" NOT NULL,
    "taxRegistrationNo" TEXT,
    "primaryActivityCode" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "subscriptionInterval" TEXT,
    "dodoCustomerId" TEXT,
    "dodoSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_periods" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TaxPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "deMinimisAbsLimit" DECIMAL(15,2) NOT NULL DEFAULT 5000000,
    "deMinimisRelLimit" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "lockedAt" TIMESTAMP(3),
    "lockedByUserId" TEXT,
    "filedAt" TIMESTAMP(3),
    "ruleVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultClassification" "Classification" NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresCounterpartyCheck" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_declarations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "activityCode" TEXT NOT NULL,
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_rules" (
    "id" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "activityCode" TEXT,
    "ifConditionsJson" JSONB NOT NULL,
    "thenClassification" "Classification" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "description" TEXT,
    "legalReference" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_transactions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "taxPeriodId" TEXT NOT NULL,
    "externalId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amountAed" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "fxRateToAed" DECIMAL(10,6),
    "counterparty" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "counterpartyType" "CounterpartyType" NOT NULL DEFAULT 'THIRD_PARTY',
    "activityCode" TEXT,
    "classification" "Classification" NOT NULL DEFAULT 'UNCLASSIFIED',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL',
    "description" TEXT,
    "invoiceNo" TEXT,
    "isCreditNote" BOOLEAN NOT NULL DEFAULT false,
    "isDeferred" BOOLEAN NOT NULL DEFAULT false,
    "linkedTransactionId" TEXT,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "lockedPeriodId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_overrides" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "previousClassification" "Classification" NOT NULL,
    "newClassification" "Classification" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "reasonText" TEXT NOT NULL,
    "overriddenByUserId" TEXT NOT NULL,
    "requiresAcknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedByUserId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "afterPeriodLock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "substance_documents" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "virusScanStatus" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "substance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_snapshots" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "bandColor" TEXT NOT NULL,
    "deMinimisScore" INTEGER NOT NULL,
    "substanceScore" INTEGER NOT NULL,
    "auditReadinessScore" INTEGER NOT NULL,
    "relatedPartyScore" INTEGER NOT NULL,
    "classificationScore" INTEGER NOT NULL,
    "breakdownJson" JSONB NOT NULL,
    "explanationText" TEXT NOT NULL,
    "deltaVsPrior" INTEGER,
    "nqrAmount" DECIMAL(15,2) NOT NULL,
    "totalRevenue" DECIMAL(15,2) NOT NULL,
    "nqrPercentage" DECIMAL(5,4) NOT NULL,
    "projectedNqrAmount" DECIMAL(15,2),
    "projectedNqrPct" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payloadJson" JSONB,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "snoozedUntil" TIMESTAMP(3),
    "snoozeReason" TEXT,
    "snoozedBy" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSentAt" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "dedupKey" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "credentialsEncrypted" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_tradeLicenseNo_key" ON "organizations"("tradeLicenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_dodoCustomerId_key" ON "organizations"("dodoCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_dodoSubscriptionId_key" ON "organizations"("dodoSubscriptionId");

-- CreateIndex
CREATE INDEX "organizations_tradeLicenseNo_idx" ON "organizations"("tradeLicenseNo");

-- CreateIndex
CREATE INDEX "organizations_freeZone_idx" ON "organizations"("freeZone");

-- CreateIndex
CREATE INDEX "users_orgId_idx" ON "users"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "users_orgId_email_key" ON "users"("orgId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_tokenHash_idx" ON "sessions"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "tax_periods_orgId_status_idx" ON "tax_periods"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tax_periods_orgId_startDate_endDate_key" ON "tax_periods"("orgId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "activity_catalog_code_key" ON "activity_catalog"("code");

-- CreateIndex
CREATE INDEX "activity_catalog_code_idx" ON "activity_catalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "activity_declarations_orgId_activityCode_key" ON "activity_declarations"("orgId", "activityCode");

-- CreateIndex
CREATE INDEX "classification_rules_ruleVersion_isActive_idx" ON "classification_rules"("ruleVersion", "isActive");

-- CreateIndex
CREATE INDEX "classification_rules_effectiveFrom_effectiveTo_idx" ON "classification_rules"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "revenue_transactions_orgId_taxPeriodId_idx" ON "revenue_transactions"("orgId", "taxPeriodId");

-- CreateIndex
CREATE INDEX "revenue_transactions_orgId_taxPeriodId_classification_isDel_idx" ON "revenue_transactions"("orgId", "taxPeriodId", "classification", "isDeleted");

-- CreateIndex
CREATE INDEX "revenue_transactions_orgId_classification_idx" ON "revenue_transactions"("orgId", "classification");

-- CreateIndex
CREATE INDEX "revenue_transactions_orgId_date_idx" ON "revenue_transactions"("orgId", "date");

-- CreateIndex
CREATE INDEX "revenue_transactions_counterpartyType_idx" ON "revenue_transactions"("counterpartyType");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_transactions_orgId_source_externalId_key" ON "revenue_transactions"("orgId", "source", "externalId");

-- CreateIndex
CREATE INDEX "classification_overrides_transactionId_idx" ON "classification_overrides"("transactionId");

-- CreateIndex
CREATE INDEX "classification_overrides_orgId_idx" ON "classification_overrides"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "substance_documents_fileKey_key" ON "substance_documents"("fileKey");

-- CreateIndex
CREATE INDEX "substance_documents_orgId_docType_idx" ON "substance_documents"("orgId", "docType");

-- CreateIndex
CREATE INDEX "substance_documents_orgId_status_idx" ON "substance_documents"("orgId", "status");

-- CreateIndex
CREATE INDEX "substance_documents_expiresAt_idx" ON "substance_documents"("expiresAt");

-- CreateIndex
CREATE INDEX "risk_snapshots_orgId_snapshotDate_idx" ON "risk_snapshots"("orgId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_dedupKey_key" ON "alerts"("dedupKey");

-- CreateIndex
CREATE INDEX "alerts_orgId_severity_isResolved_idx" ON "alerts"("orgId", "severity", "isResolved");

-- CreateIndex
CREATE INDEX "alerts_orgId_code_triggeredAt_idx" ON "alerts"("orgId", "code", "triggeredAt");

-- CreateIndex
CREATE INDEX "alerts_orgId_triggeredAt_idx" ON "alerts"("orgId", "triggeredAt");

-- CreateIndex
CREATE INDEX "audit_log_orgId_entity_entityId_idx" ON "audit_log"("orgId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_orgId_timestamp_idx" ON "audit_log"("orgId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_orgId_provider_key" ON "integrations"("orgId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_eventId_key" ON "billing_events"("eventId");

-- CreateIndex
CREATE INDEX "billing_events_orgId_idx" ON "billing_events"("orgId");

-- CreateIndex
CREATE INDEX "billing_events_eventType_idx" ON "billing_events"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "invitations_tokenHash_idx" ON "invitations"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_orgId_email_key" ON "invitations"("orgId", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_periods" ADD CONSTRAINT "tax_periods_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_declarations" ADD CONSTRAINT "activity_declarations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_declarations" ADD CONSTRAINT "activity_declarations_activityCode_fkey" FOREIGN KEY ("activityCode") REFERENCES "activity_catalog"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_activityCode_fkey" FOREIGN KEY ("activityCode") REFERENCES "activity_catalog"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_transactions" ADD CONSTRAINT "revenue_transactions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_transactions" ADD CONSTRAINT "revenue_transactions_taxPeriodId_fkey" FOREIGN KEY ("taxPeriodId") REFERENCES "tax_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_transactions" ADD CONSTRAINT "revenue_transactions_activityCode_fkey" FOREIGN KEY ("activityCode") REFERENCES "activity_catalog"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_overrides" ADD CONSTRAINT "classification_overrides_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "revenue_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_overrides" ADD CONSTRAINT "classification_overrides_overriddenByUserId_fkey" FOREIGN KEY ("overriddenByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substance_documents" ADD CONSTRAINT "substance_documents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_snapshots" ADD CONSTRAINT "risk_snapshots_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
