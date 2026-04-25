CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "PeladaConfirmation"
ADD COLUMN "cancelToken" TEXT,
ADD COLUMN "canceledAt" TIMESTAMP(3);

UPDATE "PeladaConfirmation"
SET "cancelToken" = gen_random_uuid()::text
WHERE "cancelToken" IS NULL;

ALTER TABLE "PeladaConfirmation"
ALTER COLUMN "cancelToken" SET NOT NULL;

CREATE UNIQUE INDEX "PeladaConfirmation_cancelToken_key"
ON "PeladaConfirmation"("cancelToken");

CREATE INDEX "PeladaConfirmation_cancelToken_idx"
ON "PeladaConfirmation"("cancelToken");

CREATE INDEX "PeladaConfirmation_canceledAt_idx"
ON "PeladaConfirmation"("canceledAt");
