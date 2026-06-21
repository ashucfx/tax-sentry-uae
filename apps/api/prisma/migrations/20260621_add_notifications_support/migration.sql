-- Add notification preferences and onboarding tracking to organizations
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "notificationPrefsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "onboardingStepsJson" JSONB;

-- Create support_category enum
DO $$ BEGIN
  CREATE TYPE "SupportCategory" AS ENUM ('BILLING', 'TECHNICAL', 'COMPLIANCE', 'FEATURE_REQUEST', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create support_status enum
DO $$ BEGIN
  CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create support_requests table
CREATE TABLE IF NOT EXISTS "support_requests" (
  "id"           TEXT NOT NULL,
  "orgId"        TEXT NOT NULL,
  "userId"       TEXT,
  "category"     "SupportCategory" NOT NULL DEFAULT 'OTHER',
  "subject"      TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "priority"     TEXT NOT NULL DEFAULT 'NORMAL',
  "status"       "SupportStatus" NOT NULL DEFAULT 'OPEN',
  "referenceNo"  TEXT NOT NULL,
  "attachments"  JSONB,
  "resolvedAt"   TIMESTAMP(3),
  "resolvedNote" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_requests_referenceNo_key" UNIQUE ("referenceNo")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "support_requests_orgId_status_idx" ON "support_requests"("orgId", "status");
CREATE INDEX IF NOT EXISTS "support_requests_orgId_createdAt_idx" ON "support_requests"("orgId", "createdAt");

-- Foreign key (idempotent — skip if constraint already exists)
DO $$ BEGIN
  ALTER TABLE "support_requests"
    ADD CONSTRAINT "support_requests_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
