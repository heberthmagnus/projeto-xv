CREATE TYPE "AccountRequestStatus" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');
CREATE TABLE "AccountRequest" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "supabaseAuthId" TEXT,
  "status" "AccountRequestStatus" NOT NULL DEFAULT 'PENDENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedBy" TEXT,
  CONSTRAINT "AccountRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AccountRequest_status_createdAt_idx" ON "AccountRequest"("status", "createdAt");
CREATE UNIQUE INDEX "AccountRequest_supabaseAuthId_key" ON "AccountRequest"("supabaseAuthId");
CREATE UNIQUE INDEX "AccountRequest_pending_email_key" ON "AccountRequest" (lower("email")) WHERE "status" = 'PENDENTE';
ALTER TABLE public."AccountRequest" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AccountRequest" FROM anon, authenticated;

CREATE TABLE "RequestRateLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RequestRateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "RequestRateLimit_resetAt_idx" ON "RequestRateLimit"("resetAt");
ALTER TABLE public."RequestRateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."RequestRateLimit" FROM anon, authenticated;

CREATE TABLE "AuthEmailDelivery" (
  "webhookId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthEmailDelivery_pkey" PRIMARY KEY ("webhookId"),
  CONSTRAINT "AuthEmailDelivery_status_check" CHECK ("status" IN ('PROCESSING', 'SENT', 'UNKNOWN'))
);
CREATE INDEX "AuthEmailDelivery_createdAt_idx" ON "AuthEmailDelivery"("createdAt");
ALTER TABLE public."AuthEmailDelivery" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AuthEmailDelivery" FROM anon, authenticated;
