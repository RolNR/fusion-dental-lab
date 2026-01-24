import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');

    // Read exported data
    const dataPath = path.join(process.cwd(), 'data-backup.json');

    if (!fs.existsSync(dataPath)) {
      console.log('No backup data found. Skipping seed.');
      return;
    }

    const backupData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log('Restoring data...');

    // 1. Restore Laboratories
    if (backupData.laboratories) {
      for (const lab of backupData.laboratories) {
        await prisma.laboratory.create({
          data: {
            id: lab.id,
            name: lab.name,
            email: lab.email,
            phone: lab.phone,
            address: lab.address,
            isActive: lab.isActive,
            createdAt: new Date(lab.createdAt),
            updatedAt: new Date(lab.updatedAt),
          },
        });
      }
      console.log(`Restored ${backupData.laboratories.length} laboratories`);
    }

    // 2. Restore Users
    if (backupData.users) {
      for (const user of backupData.users) {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            passwordHash: user.passwordHash,
            role: user.role,
            laboratoryId: user.laboratoryId,
            labCollaboratorId: user.labCollaboratorId,
            doctorLaboratoryId: user.doctorLaboratoryId,
            phone: user.phone,
            clinicName: user.clinicName,
            clinicAddress: user.clinicAddress,
            razonSocial: user.razonSocial,
            fiscalAddress: user.fiscalAddress,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
      }
      console.log(`Restored ${backupData.users.length} users`);
    }

    // 3. Restore Orders
    if (backupData.orders) {
      for (const order of backupData.orders) {
        await prisma.order.create({
          data: {
            id: order.id,
            orderNumber: order.orderNumber,
            patientName: order.patientName,
            patientId: order.patientId,
            description: order.description,
            notes: order.notes,
            fechaEntregaDeseada: order.fechaEntregaDeseada ? new Date(order.fechaEntregaDeseada) : null,
            aiPrompt: order.aiPrompt,
            teethNumbers: order.teethNumbers,
            color: order.color,
            scanType: order.scanType,
            tipoCaso: order.tipoCaso,
            motivoGarantia: order.motivoGarantia,
            seDevuelveTrabajoOriginal: order.seDevuelveTrabajoOriginal,
            escanerUtilizado: order.escanerUtilizado,
            otroEscaner: order.otroEscaner,
            tipoSilicon: order.tipoSilicon,
            notaModeloFisico: order.notaModeloFisico,
            materialSent: order.materialSent,
            submissionType: order.submissionType,
            oclusionDiseno: order.oclusionDiseno,
            articulatedBy: order.articulatedBy,
            status: order.status,
            isUrgent: order.isUrgent ?? false,
            createdById: order.createdById,
            doctorId: order.doctorId,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            submittedAt: order.submittedAt ? new Date(order.submittedAt) : null,
            materialsSentAt: order.materialsSentAt ? new Date(order.materialsSentAt) : null,
            completedAt: order.completedAt ? new Date(order.completedAt) : null,
          },
        });
      }
      console.log(`Restored ${backupData.orders.length} orders`);
    }

    // 4. Restore Teeth
    if (backupData.teeth) {
      for (const tooth of backupData.teeth) {
        await prisma.tooth.create({
          data: {
            id: tooth.id,
            orderId: tooth.orderId,
            toothNumber: tooth.toothNumber,
            material: tooth.material,
            materialBrand: tooth.materialBrand,
            colorInfo: tooth.colorInfo,
            tipoTrabajo: tooth.tipoTrabajo,
            tipoRestauracion: tooth.tipoRestauracion,
            trabajoSobreImplante: tooth.trabajoSobreImplante,
            informacionImplante: tooth.informacionImplante,
            createdAt: new Date(tooth.createdAt),
            updatedAt: new Date(tooth.updatedAt),
          },
        });
      }
      console.log(`Restored ${backupData.teeth.length} teeth`);
    }

    // 5. Restore Files
    if (backupData.files) {
      for (const file of backupData.files) {
        await prisma.file.create({
          data: {
            id: file.id,
            fileName: file.fileName,
            originalName: file.originalName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            storageKey: file.storageKey,
            storageUrl: file.storageUrl,
            category: file.category,
            thumbnailUrl: file.thumbnailUrl,
            isProcessed: file.isProcessed,
            orderId: file.orderId,
            uploadedById: file.uploadedById,
            createdAt: new Date(file.createdAt),
            expiresAt: file.expiresAt ? new Date(file.expiresAt) : null,
            deletedAt: file.deletedAt ? new Date(file.deletedAt) : null,
          },
        });
      }
      console.log(`Restored ${backupData.files.length} files`);
    }

    // 6. Restore Alerts
    if (backupData.alerts) {
      for (const alert of backupData.alerts) {
        await prisma.alert.create({
          data: {
            id: alert.id,
            message: alert.message,
            status: alert.status,
            orderId: alert.orderId,
            senderId: alert.senderId,
            receiverId: alert.receiverId,
            createdAt: new Date(alert.createdAt),
            readAt: alert.readAt ? new Date(alert.readAt) : null,
            resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null,
          },
        });
      }
      console.log(`Restored ${backupData.alerts.length} alerts`);
    }

    // 7. Restore Order Comments
    if (backupData.orderComments) {
      for (const comment of backupData.orderComments) {
        await prisma.orderComment.create({
          data: {
            id: comment.id,
            content: comment.content,
            isInternal: comment.isInternal,
            orderId: comment.orderId,
            authorId: comment.authorId,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          },
        });
      }
      console.log(`Restored ${backupData.orderComments.length} order comments`);
    }

    // 8. Restore Audit Logs
    if (backupData.auditLogs) {
      for (const log of backupData.auditLogs) {
        await prisma.auditLog.create({
          data: {
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            oldValue: log.oldValue,
            newValue: log.newValue,
            metadata: log.metadata,
            userId: log.userId,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            orderId: log.orderId,
            fileId: log.fileId,
            alertId: log.alertId,
            createdAt: new Date(log.createdAt),
          },
        });
      }
      console.log(`Restored ${backupData.auditLogs.length} audit logs`);
    }

    console.log('\nDatabase seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
