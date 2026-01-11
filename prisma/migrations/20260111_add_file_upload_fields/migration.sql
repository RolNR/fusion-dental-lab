-- Add file upload fields to File table
ALTER TABLE "File" ADD COLUMN "category" TEXT;
ALTER TABLE "File" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "File" ADD COLUMN "isProcessed" BOOLEAN NOT NULL DEFAULT false;

-- Add index for category field
CREATE INDEX "File_category_idx" ON "File"("category");
