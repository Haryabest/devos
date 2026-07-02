-- AlterTable: Client already has contacts Json
-- Add projectId to DocumentFolder

ALTER TABLE "DocumentFolder" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

CREATE INDEX IF NOT EXISTS "DocumentFolder_projectId_idx" ON "DocumentFolder"("projectId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentFolder_projectId_fkey'
  ) THEN
    ALTER TABLE "DocumentFolder"
      ADD CONSTRAINT "DocumentFolder_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
