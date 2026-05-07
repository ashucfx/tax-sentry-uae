-- AlterTable: make email nullable (phone-only OTP users have no email)
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: make passwordHash nullable (OTP users have no password)
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable: add phone field
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- CreateIndex: unique phone
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateTable: otp_codes
CREATE TABLE "otp_codes" (
    "id"         TEXT        NOT NULL,
    "email"      TEXT,
    "phone"      TEXT,
    "codeHash"   TEXT        NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts"   INTEGER     NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_email_idx" ON "otp_codes"("email");
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes"("phone");
