CREATE TABLE "SiteSuggestion" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "contact" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "allowContact" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteSuggestion_status_createdAt_idx" ON "SiteSuggestion"("status", "createdAt");
