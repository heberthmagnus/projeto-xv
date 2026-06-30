CREATE TYPE "RegistrationCategory" AS ENUM ('ADULTO', 'MASTER');

ALTER TABLE "Registration"
ADD COLUMN "category" "RegistrationCategory";

CREATE INDEX "Registration_championshipId_category_idx"
ON "Registration"("championshipId", "category");
