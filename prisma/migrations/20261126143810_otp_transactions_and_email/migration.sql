-- AlterTable
ALTER TABLE "AbhaProfile" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "OtpTransaction" (
    "id" TEXT NOT NULL,
    "rateKey" TEXT NOT NULL,
    "abhaNumber" TEXT,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "wrongAttempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpTransaction_rateKey_createdAt_idx" ON "OtpTransaction"("rateKey", "createdAt");
