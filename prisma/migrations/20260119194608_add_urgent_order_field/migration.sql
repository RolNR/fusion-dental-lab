-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_isUrgent_idx" ON "Order"("isUrgent");
