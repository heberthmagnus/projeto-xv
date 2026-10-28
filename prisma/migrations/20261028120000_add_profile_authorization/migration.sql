-- Additive only: legacy User.role and credentials are preserved.
CREATE TYPE "PlatformRole" AS ENUM ('ROOT', 'DIRETORIA', 'SECRETARIA', 'ASSOCIADO');
CREATE TYPE "MembershipStatus" AS ENUM ('ATIVO', 'INATIVO', 'SUSPENSO');
CREATE TYPE "MembershipCategory" AS ENUM ('PROPRIETARIO', 'FAMILIAR');
CREATE TABLE "UserRole" (
  "userId" TEXT NOT NULL,
  "role" "PlatformRole" NOT NULL,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "role"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Member" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "category" "MembershipCategory" NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'ATIVO',
  "membershipCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Member_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
CREATE UNIQUE INDEX "Member_membershipCode_key" ON "Member"("membershipCode");
CREATE TABLE "AdministrativeAudit" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "previous" JSONB,
  "next" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdministrativeAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdministrativeAudit_target_createdAt_idx" ON "AdministrativeAudit"("target", "createdAt");

-- No browser Data API access: the application uses Prisma on the server.
ALTER TABLE public."UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdministrativeAudit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."UserRole", public."Member", public."AdministrativeAudit" FROM anon, authenticated;
