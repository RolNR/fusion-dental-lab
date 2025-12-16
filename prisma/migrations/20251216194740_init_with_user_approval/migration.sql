-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DENTIST', 'LAB', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'MATERIALS_SENT', 'NEEDS_INFO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('DIGITAL_SCAN', 'ANALOG_MOLD');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('UNREAD', 'READ', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'USER_APPROVED', 'USER_REJECTED', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_DELETE', 'STATUS_CHANGE', 'ALERT_SENT', 'ALERT_READ');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientId" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "teethNumbers" TEXT,
    "material" TEXT,
    "materialBrand" TEXT,
    "color" TEXT,
    "scanType" "ScanType",
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "dentistId" TEXT NOT NULL,
    "labId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "materialsSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'UNREAD',
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "orderId" TEXT,
    "fileId" TEXT,
    "alertId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isApproved_idx" ON "User"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_dentistId_idx" ON "Order"("dentistId");

-- CreateIndex
CREATE INDEX "Order_labId_idx" ON "Order"("labId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "File_orderId_idx" ON "File"("orderId");

-- CreateIndex
CREATE INDEX "File_uploadedById_idx" ON "File"("uploadedById");

-- CreateIndex
CREATE INDEX "File_createdAt_idx" ON "File"("createdAt");

-- CreateIndex
CREATE INDEX "File_expiresAt_idx" ON "File"("expiresAt");

-- CreateIndex
CREATE INDEX "File_storageKey_idx" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "Alert_orderId_idx" ON "Alert"("orderId");

-- CreateIndex
CREATE INDEX "Alert_senderId_idx" ON "Alert"("senderId");

-- CreateIndex
CREATE INDEX "Alert_receiverId_idx" ON "Alert"("receiverId");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_orderId_idx" ON "AuditLog"("orderId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_labId_fkey" FOREIGN KEY ("labId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
