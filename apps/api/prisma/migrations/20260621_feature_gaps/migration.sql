-- ─── Organization new fields ──────────────────────────────────────────────────
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "billingEmail"        TEXT,
  ADD COLUMN IF NOT EXISTS "billingAddress"      TEXT,
  ADD COLUMN IF NOT EXISTS "dpaAcceptedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "alertThresholdsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "cancelledAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedAt"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy"           TEXT;

-- ─── User new fields ──────────────────────────────────────────────────────────
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "totpSecret"           TEXT,
  ADD COLUMN IF NOT EXISTS "totpBackupCodes"      TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "totpVerifiedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pendingEmail"         TEXT,
  ADD COLUMN IF NOT EXISTS "pendingEmailToken"    TEXT,
  ADD COLUMN IF NOT EXISTS "pendingEmailExpiry"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notificationPrefsJson" JSONB;

-- ─── SubstanceDocument new fields ─────────────────────────────────────────────
ALTER TABLE "substance_documents"
  ADD COLUMN IF NOT EXISTS "version"           INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "previousVersionId" TEXT;

-- Self-referential FK for document versioning (idempotent)
DO $$ BEGIN
  ALTER TABLE "substance_documents"
    ADD CONSTRAINT "substance_documents_previousVersionId_fkey"
    FOREIGN KEY ("previousVersionId") REFERENCES "substance_documents"("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── SupportRequest new fields ────────────────────────────────────────────────
ALTER TABLE "support_requests"
  ADD COLUMN IF NOT EXISTS "assignedTo"      TEXT,
  ADD COLUMN IF NOT EXISTS "firstResponseAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "internalNote"    TEXT;

-- ─── SupportComment table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "support_comments" (
  "id"          TEXT NOT NULL,
  "requestId"   TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "userId"      TEXT,
  "isInternal"  BOOLEAN NOT NULL DEFAULT false,
  "body"        TEXT NOT NULL,
  "attachments" JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "support_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_comments_requestId_idx" ON "support_comments"("requestId");
CREATE INDEX IF NOT EXISTS "support_comments_orgId_idx"     ON "support_comments"("orgId");

DO $$ BEGIN
  ALTER TABLE "support_comments"
    ADD CONSTRAINT "support_comments_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "support_requests"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── NotificationLog table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notification_logs" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "sentAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status"    TEXT NOT NULL DEFAULT 'SENT',
  "errorText" TEXT,
  "metadata"  JSONB,

  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_logs_orgId_type_idx"  ON "notification_logs"("orgId", "type");
CREATE INDEX IF NOT EXISTS "notification_logs_orgId_sentAt_idx" ON "notification_logs"("orgId", "sentAt");

DO $$ BEGIN
  ALTER TABLE "notification_logs"
    ADD CONSTRAINT "notification_logs_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── ReportRecord table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "report_records" (
  "id"                TEXT NOT NULL,
  "orgId"             TEXT NOT NULL,
  "taxPeriodId"       TEXT,
  "type"              TEXT NOT NULL,
  "fileKey"           TEXT,
  "generatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generatedByUserId" TEXT NOT NULL,
  "parametersJson"    JSONB,
  "status"            TEXT NOT NULL DEFAULT 'COMPLETED',
  "errorText"         TEXT,

  CONSTRAINT "report_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "report_records_orgId_type_idx"       ON "report_records"("orgId", "type");
CREATE INDEX IF NOT EXISTS "report_records_orgId_generatedAt_idx" ON "report_records"("orgId", "generatedAt");

DO $$ BEGIN
  ALTER TABLE "report_records"
    ADD CONSTRAINT "report_records_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── ApiKey table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id"         TEXT NOT NULL,
  "orgId"      TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "keyHash"    TEXT NOT NULL,
  "prefix"     TEXT NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt"  TIMESTAMP(3),
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_keys_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "api_keys_keyHash_key" UNIQUE ("keyHash")
);

CREATE INDEX IF NOT EXISTS "api_keys_orgId_idx" ON "api_keys"("orgId");

DO $$ BEGIN
  ALTER TABLE "api_keys"
    ADD CONSTRAINT "api_keys_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
