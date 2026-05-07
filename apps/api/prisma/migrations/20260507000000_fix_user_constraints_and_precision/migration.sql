-- Migration: fix_user_constraints_and_precision
-- 1. Remove globally-unique email/phone constraints from users table
--    (kept: @@unique([orgId, email]) — intra-org uniqueness is sufficient for multi-tenancy)
-- 2. Replace removed unique indexes with plain indexes for fast lookups
-- 3. Fix nqrPercentage / projectedNqrPct numeric precision: DECIMAL(5,4) maxes at 9.9999;
--    breaches above 10% overflow. Change to DECIMAL(7,4) — supports up to 999.9999%.
-- 4. Add missing (orgId, isDeleted) index on revenue_transactions for soft-delete filter perf.

-- ── 1. Drop globally-unique email constraint ──────────────────────────────────
-- Prisma created this as users_email_key
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";

-- ── 2. Drop globally-unique phone constraint ──────────────────────────────────
-- Prisma created this as users_phone_key
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key";

-- ── 3. Create plain indexes for email and phone lookups ───────────────────────
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");

-- ── 4. Fix decimal precision on risk_snapshots ────────────────────────────────
ALTER TABLE "risk_snapshots"
  ALTER COLUMN "nqrPercentage"  TYPE DECIMAL(7, 4),
  ALTER COLUMN "projectedNqrPct" TYPE DECIMAL(7, 4);

-- ── 5. Add missing soft-delete filter index on revenue_transactions ───────────
CREATE INDEX IF NOT EXISTS "revenue_transactions_orgId_isDeleted_idx"
  ON "revenue_transactions"("orgId", "isDeleted");
