/**
 * Seed script — seeds activity catalog from Cabinet Decision 100/2023
 * and Ministerial Decision 265/2023
 * Run: npm run db:seed
 */

import { PrismaClient, Classification } from '@prisma/client';

const prisma = new PrismaClient();

const RULE_VERSION = 'CD100-2023-v1';

const ACTIVITIES = [
  // ─── EXCLUDED ACTIVITIES (Layer 1) ────────────────────────────────────────
  {
    code: 'UAE_IMMOVABLE_PROPERTY',
    name: 'UAE Immovable Property Income',
    description: 'Income from UAE-sourced immovable property (non-FZP commercial)',
    defaultClassification: Classification.EXCLUDED,
    requiresCounterpartyCheck: false,
    notes: 'Excluded per Cabinet Decision 100/2023. NOT in de-minimis denominator.',
  },
  {
    code: 'UAE_BRANCH_INCOME',
    name: 'UAE Branch Income',
    description: 'Income from a UAE-based branch of a Free Zone entity',
    defaultClassification: Classification.EXCLUDED,
    requiresCounterpartyCheck: false,
    notes: 'Excluded per Cabinet Decision 100/2023.',
  },
  {
    code: 'NON_COMMERCIAL_OUTSIDE_FZ',
    name: 'Non-Commercial Activities Outside Free Zone',
    description: 'Income from non-commercial activities conducted outside the Free Zone',
    defaultClassification: Classification.EXCLUDED,
    requiresCounterpartyCheck: false,
    notes: 'Excluded per Cabinet Decision 100/2023.',
  },
  {
    code: 'BANKING_UNLICENSED',
    name: 'Banking Activities (Unlicensed)',
    description: 'Banking activities without appropriate regulatory license',
    defaultClassification: Classification.EXCLUDED,
    requiresCounterpartyCheck: false,
    notes: 'Excluded unless licensed. If licensed, reclassify.',
  },
  {
    code: 'INSURANCE_UNLICENSED',
    name: 'Insurance Activities (Unlicensed)',
    description: 'Insurance activities without appropriate regulatory license',
    defaultClassification: Classification.EXCLUDED,
    requiresCounterpartyCheck: false,
    notes: 'Excluded unless licensed.',
  },

  // ─── QUALIFYING ACTIVITIES (Layer 2) ─────────────────────────────────────
  {
    code: 'MANUFACTURING',
    name: 'Manufacturing of Goods',
    description: 'Manufacturing and production of goods within or for the Free Zone',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'QI per Ministerial Decision 265/2023. Counterparty test applies.',
  },
  {
    code: 'PROCESSING_GOODS',
    name: 'Processing of Goods',
    description: 'Processing, transformation, or value-addition of goods',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'QI per Ministerial Decision 265/2023.',
  },
  {
    code: 'TRADING_COMMODITIES',
    name: 'Trading of Qualifying Commodities',
    description: 'Trading of qualifying commodities (can be QI with non-FZ counterparties)',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: false,
    notes: 'QI regardless of counterparty type. One of the key exceptions.',
  },
  {
    code: 'HOLDING_SHARES',
    name: 'Holding of Shares and Securities',
    description: 'Holding of shares and securities for investment purposes',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: false,
    notes: 'QI per Ministerial Decision 265/2023. Investment purpose required.',
  },
  {
    code: 'SHIP_OPERATIONS',
    name: 'Ship Ownership/Operation/Management',
    description: 'Ownership, operation, or management of ships',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'QI per Ministerial Decision 265/2023.',
  },
  {
    code: 'REINSURANCE',
    name: 'Reinsurance (Regulated)',
    description: 'Reinsurance activities with appropriate regulatory license',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'Must be regulated/licensed.',
  },
  {
    code: 'FUND_MANAGEMENT',
    name: 'Fund Management (Regulated)',
    description: 'Fund management services with appropriate regulatory authorization',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'Must be regulated. DFSA/ADGM/SCA license required.',
  },
  {
    code: 'WEALTH_MANAGEMENT',
    name: 'Wealth Management (Regulated)',
    description: 'Wealth management services with appropriate regulatory license',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'Must be regulated.',
  },
  {
    code: 'HQ_SERVICES',
    name: 'HQ Services to Related Parties',
    description: 'Headquarters services provided to related parties within a group',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'MUST be related-party transaction. Non-related = NQI.',
  },
  {
    code: 'TREASURY_FINANCING',
    name: 'Treasury and Financing Services to Related Parties',
    description: 'Treasury and financing services provided to related-party group entities',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'MUST be related-party. Arm\'s length pricing required.',
  },
  {
    code: 'AIRCRAFT_FINANCING',
    name: 'Financing and Leasing of Aircraft',
    description: 'Financing and leasing of aircraft or aircraft components',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'QI per Ministerial Decision 265/2023.',
  },
  {
    code: 'LOGISTICS',
    name: 'Logistics Services',
    description: 'Logistics, supply chain, and freight forwarding services',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'QI per Ministerial Decision 265/2023. Counterparty test applies.',
  },
  {
    code: 'DISTRIBUTION_DESIGNATED',
    name: 'Distribution in/from Designated Zones',
    description: 'Distribution of goods in or from UAE Designated Zones',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: false,
    notes: 'Goods must physically enter a Designated Zone. Not all Free Zones qualify.',
  },
  {
    code: 'ANCILLARY_QI',
    name: 'Ancillary to Qualifying Activity',
    description: 'Income ancillary to a qualifying activity (e.g., scrap rope from shipping)',
    defaultClassification: Classification.QI,
    requiresCounterpartyCheck: true,
    notes: 'Must be <5% of parent qualifying activity revenue.',
  },
];

async function main() {
  console.log('Seeding activity catalog...');

  for (const activity of ACTIVITIES) {
    await prisma.activityCatalog.upsert({
      where: { code: activity.code },
      update: { ...activity, ruleVersion: RULE_VERSION },
      create: { ...activity, ruleVersion: RULE_VERSION },
    });
    console.log(`  ✓ ${activity.code}`);
  }

  // Seed initial classification rules
  const rules = [
    {
      ruleVersion: RULE_VERSION,
      activityCode: 'TRADING_COMMODITIES',
      ifConditionsJson: { activityCode: 'TRADING_COMMODITIES' },
      thenClassification: Classification.QI,
      priority: 10,
      effectiveFrom: new Date('2023-06-01'),
      description: 'Trading commodities is QI regardless of counterparty type',
      legalReference: 'Ministerial Decision 265/2023, Article 3(1)(b)',
    },
    {
      ruleVersion: RULE_VERSION,
      activityCode: null,
      ifConditionsJson: { layer: 3, default: true },
      thenClassification: Classification.NQI,
      priority: 0,
      effectiveFrom: new Date('2023-06-01'),
      description: 'Default: anything not caught by Layer 1 or 2 = NQI',
      legalReference: 'Cabinet Decision 100/2023, Article 18',
    },
  ];

  for (const rule of rules) {
    await prisma.classificationRule.create({ data: rule }).catch(() => null);
  }

  console.log('\nActivity catalog seeded successfully.');
  console.log(`Total activities: ${ACTIVITIES.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
