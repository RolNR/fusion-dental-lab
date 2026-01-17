-- CreateEnum
CREATE TYPE "ArticulatedBy" AS ENUM ('doctor', 'laboratorio');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('nuevo', 'garantia');

-- CreateEnum
CREATE TYPE "RestorationType" AS ENUM ('corona', 'puente', 'inlay', 'onlay', 'carilla', 'provisional');

-- CreateEnum
CREATE TYPE "ScannerType" AS ENUM ('iTero', 'Medit', 'ThreeShape', 'Carestream', 'Otro');

-- CreateEnum
CREATE TYPE "SiliconType" AS ENUM ('adicion', 'condensacion');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('prueba_estructura', 'prueba_estetica', 'terminado');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('restauracion', 'otro');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_DELETE', 'STATUS_CHANGE', 'ALERT_SENT', 'ALERT_READ');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('LAB_ADMIN', 'LAB_COLLABORATOR', 'CLINIC_ADMIN', 'DOCTOR', 'CLINIC_ASSISTANT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_dentistId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_labId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_approvedById_fkey";

-- DropIndex
DROP INDEX "Order_dentistId_idx";

-- DropIndex
DROP INDEX "Order_labId_idx";

-- DropIndex
DROP INDEX "User_isApproved_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "dentistId",
DROP COLUMN "labId",
DROP COLUMN "material",
DROP COLUMN "materialBrand",
ADD COLUMN     "aiPrompt" TEXT,
ADD COLUMN     "articulatedBy" "ArticulatedBy" DEFAULT 'doctor',
ADD COLUMN     "clinicId" TEXT NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "escanerUtilizado" "ScannerType",
ADD COLUMN     "fechaEntregaDeseada" TIMESTAMP(3),
ADD COLUMN     "materialSent" JSONB,
ADD COLUMN     "motivoGarantia" TEXT,
ADD COLUMN     "notaModeloFisico" TEXT,
ADD COLUMN     "oclusionDiseno" JSONB,
ADD COLUMN     "otroEscaner" TEXT,
ADD COLUMN     "seDevuelveTrabajoOriginal" BOOLEAN,
ADD COLUMN     "submissionType" "SubmissionType" DEFAULT 'terminado',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "tipoCaso" "CaseType" DEFAULT 'nuevo',
ADD COLUMN     "tipoSilicon" "SiliconType";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "isApproved",
ADD COLUMN     "activeClinicId" TEXT,
ADD COLUMN     "assistantClinicId" TEXT,
ADD COLUMN     "clinicId" TEXT,
ADD COLUMN     "labCollaboratorId" TEXT,
ADD COLUMN     "laboratoryId" TEXT;

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "laboratoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorAssistant" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorClinic" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorClinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tooth" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "toothNumber" TEXT NOT NULL,
    "material" TEXT,
    "materialBrand" TEXT,
    "colorInfo" JSONB,
    "tipoTrabajo" "WorkType",
    "tipoRestauracion" "RestorationType",
    "trabajoSobreImplante" BOOLEAN DEFAULT false,
    "informacionImplante" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tooth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Clinic_isActive_idx" ON "Clinic"("isActive");

-- CreateIndex
CREATE INDEX "Clinic_laboratoryId_idx" ON "Clinic"("laboratoryId");

-- CreateIndex
CREATE INDEX "DoctorAssistant_assistantId_idx" ON "DoctorAssistant"("assistantId");

-- CreateIndex
CREATE INDEX "DoctorAssistant_doctorId_idx" ON "DoctorAssistant"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAssistant_doctorId_assistantId_key" ON "DoctorAssistant"("doctorId", "assistantId");

-- CreateIndex
CREATE INDEX "DoctorClinic_clinicId_idx" ON "DoctorClinic"("clinicId");

-- CreateIndex
CREATE INDEX "DoctorClinic_doctorId_idx" ON "DoctorClinic"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorClinic_doctorId_clinicId_key" ON "DoctorClinic"("doctorId", "clinicId");

-- CreateIndex
CREATE INDEX "Laboratory_isActive_idx" ON "Laboratory"("isActive");

-- CreateIndex
CREATE INDEX "Tooth_orderId_idx" ON "Tooth"("orderId");

-- CreateIndex
CREATE INDEX "Tooth_toothNumber_idx" ON "Tooth"("toothNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tooth_orderId_toothNumber_key" ON "Tooth"("orderId", "toothNumber");

-- CreateIndex
CREATE INDEX "OrderComment_authorId_idx" ON "OrderComment"("authorId");

-- CreateIndex
CREATE INDEX "OrderComment_createdAt_idx" ON "OrderComment"("createdAt");

-- CreateIndex
CREATE INDEX "OrderComment_isInternal_idx" ON "OrderComment"("isInternal");

-- CreateIndex
CREATE INDEX "OrderComment_orderId_idx" ON "OrderComment"("orderId");

-- CreateIndex
CREATE INDEX "Order_clinicId_idx" ON "Order"("clinicId");

-- CreateIndex
CREATE INDEX "Order_createdById_idx" ON "Order"("createdById");

-- CreateIndex
CREATE INDEX "Order_doctorId_idx" ON "Order"("doctorId");

-- CreateIndex
CREATE INDEX "User_activeClinicId_idx" ON "User"("activeClinicId");

-- CreateIndex
CREATE INDEX "User_assistantClinicId_idx" ON "User"("assistantClinicId");

-- CreateIndex
CREATE INDEX "User_clinicId_idx" ON "User"("clinicId");

-- CreateIndex
CREATE INDEX "User_laboratoryId_idx" ON "User"("laboratoryId");

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAssistant" ADD CONSTRAINT "DoctorAssistant_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAssistant" ADD CONSTRAINT "DoctorAssistant_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinic" ADD CONSTRAINT "DoctorClinic_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinic" ADD CONSTRAINT "DoctorClinic_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tooth" ADD CONSTRAINT "Tooth_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assistantClinicId_fkey" FOREIGN KEY ("assistantClinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_labCollaboratorId_fkey" FOREIGN KEY ("labCollaboratorId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

