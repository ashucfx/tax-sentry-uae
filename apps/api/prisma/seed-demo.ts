import { PrismaClient, FreeZone, CounterpartyType } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function sha256(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function main() {
  console.log('Seeding demo environment...');

  const orgId = 'demo-org-id';
  const userId = 'demo-user-id';
  const taxPeriodId = 'demo-tax-period-id';

  // 1. Cleanup existing demo data
  await prisma.user.deleteMany({ where: { email: 'demo@taxsentry.com' } });
  await prisma.organization.deleteMany({ where: { id: orgId } });

  // 2. Create Organization
  console.log('Creating demo organization...');
  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: 'Acme Trading FZCO',
      tradeLicenseNo: 'DMCC-123456',
      freeZone: FreeZone.DMCC,
      taxRegistrationNo: '100234567890123',
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: 'ENTERPRISE',
      primaryActivityCode: 'TRADING_001',
    },
  });

  // 3. Create User
  console.log('Creating demo user...');
  await prisma.user.create({
    data: {
      id: userId,
      email: 'demo@taxsentry.com',
      role: 'OWNER',
      orgId: org.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // 4. Create Tax Period
  console.log('Creating tax period...');
  const startDate = new Date('2024-01-01T00:00:00Z');
  const endDate = new Date('2024-12-31T23:59:59Z');
  await prisma.taxPeriod.create({
    data: {
      id: taxPeriodId,
      orgId: org.id,
      startDate,
      endDate,
      status: 'OPEN',
      ruleVersionId: 'CD100-2023-v1',
    },
  });

  // 5. Generate Transactions
  console.log('Generating realistic transactions...');
  const transactions = [];
  const counterparties = [
    { name: 'Gulf General Trading LLC', isRelated: false },
    { name: 'Global Logistics GmbH', isRelated: false },
    { name: 'Emirates Shipping Co.', isRelated: false },
    { name: 'Tech Solutions FZ-LLC', isRelated: false },
    { name: 'Acme Holding B.V.', isRelated: true },
  ];

  let totalNqi = 0;
  let totalRevenue = 0;

  for (let i = 0; i < 150; i++) {
    const cp = counterparties[Math.floor(Math.random() * counterparties.length)];
    const isNqi = Math.random() > 0.95; // ~5% NQI
    const baseAmount = Math.floor(Math.random() * 50000) + 10000;
    const amount = isNqi ? baseAmount * 0.5 : baseAmount * 2; // Make NQI smaller, QI larger

    const date = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));

    let classification: any = 'QI';
    if (isNqi) classification = 'NQI';
    if (Math.random() > 0.98) classification = 'UNCLASSIFIED';

    if (classification === 'NQI') totalNqi += amount;
    if (classification !== 'UNCLASSIFIED') totalRevenue += amount;

    transactions.push({
      orgId: org.id,
      taxPeriodId,
      date,
      amountAed: amount,
      counterparty: cp.name,
      counterpartyType: cp.isRelated ? CounterpartyType.RELATED : CounterpartyType.THIRD_PARTY,
      classification,
      description: `Invoice INV-${2024000 + i}`,
    });
  }

  await prisma.revenueTransaction.createMany({ data: transactions });
  console.log(`Generated 150 transactions. NQI: ${totalNqi}, Total: ${totalRevenue}`);

  // 6. Create Substance Documents
  console.log('Adding substance documents...');
  await prisma.substanceDocument.createMany({
    data: [
      {
        orgId: org.id,
        docType: 'TRADE_LICENSE',
        fileName: 'DMCC_License_2024.pdf',
        fileKey: 'dummy/license.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
        displayName: 'DMCC Trade License 2024',
        status: 'ACTIVE',
        expiresAt: new Date('2024-12-31T00:00:00Z'),
      },
      {
        orgId: org.id,
        docType: 'LEASE_AGREEMENT',
        fileName: 'Office_Lease_Contract.pdf',
        fileKey: 'dummy/lease.pdf',
        fileSize: 204800,
        mimeType: 'application/pdf',
        displayName: 'JLT Office Lease Agreement',
        status: 'ACTIVE',
        expiresAt: new Date('2024-10-31T00:00:00Z'),
      },
    ],
  });

  // 7. Create Risk Snapshots (To show history)
  console.log('Creating risk snapshot history...');
  await prisma.riskSnapshot.create({
    data: {
      orgId: org.id,
      snapshotDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      score: 92,
      bandColor: 'GREEN',
      deMinimisScore: 40,
      substanceScore: 25,
      auditReadinessScore: 12,
      relatedPartyScore: 10,
      classificationScore: 5,
      breakdownJson: {},
      nqrAmount: totalNqi * 0.6,
      totalRevenue: totalRevenue * 0.7,
      nqrPercentage: ((totalNqi * 0.6) / (totalRevenue * 0.7)) * 100 || 0,
      explanationText: 'Risk increased slightly due to rising NQI.',
    },
  });

  await prisma.riskSnapshot.create({
    data: {
      orgId: org.id,
      snapshotDate: new Date(),
      score: 74,
      bandColor: 'AMBER',
      deMinimisScore: 25,
      substanceScore: 25,
      auditReadinessScore: 10,
      relatedPartyScore: 6,
      classificationScore: 8,
      breakdownJson: {},
      nqrAmount: totalNqi,
      totalRevenue: totalRevenue,
      nqrPercentage: (totalNqi / totalRevenue) * 100 || 0,
      explanationText: 'Warning: De-Minimis buffer is narrowing.',
    },
  });

  console.log('✅ Demo environment seeded successfully!');
  console.log('Login: demo@taxsentry.com / Demo123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
