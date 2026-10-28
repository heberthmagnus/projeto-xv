-- Accounts remain on their existing credentials until explicitly linked.
ALTER TABLE "User" ADD COLUMN "supabaseAuthId" TEXT;
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");
