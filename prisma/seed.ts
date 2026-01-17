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
    console.log(`✅ Restored ${backupData.laboratories.length} laboratories`);

    // 2. Restore Clinics
    for (const clinic of backupData.clinics) {
      await prisma.clinic.create({
        data: {
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          phone: clinic.phone,
          address: clinic.address,
          isActive: clinic.isActive,
          laboratoryId: clinic.laboratoryId,
          createdAt: new Date(clinic.createdAt),
          updatedAt: new Date(clinic.updatedAt),
        },
      });
    }
    console.log(`✅ Restored ${backupData.clinics.length} clinics`);

    // 3. Restore Users
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
          clinicId: user.clinicId,
          activeClinicId: user.activeClinicId,
          assistantClinicId: user.assistantClinicId,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`✅ Restored ${backupData.users.length} users`);

    // 4. Restore DoctorClinic relationships
    for (const dc of backupData.doctorClinics) {
      await prisma.doctorClinic.create({
        data: {
          id: dc.id,
          doctorId: dc.doctorId,
          clinicId: dc.clinicId,
          isPrimary: dc.isPrimary,
          createdAt: new Date(dc.createdAt),
          updatedAt: new Date(dc.updatedAt),
        },
      });
    }
    console.log(`✅ Restored ${backupData.doctorClinics.length} doctor-clinic relationships`);

    // 5. Restore DoctorAssistant relationships
    for (const da of backupData.doctorAssistants) {
      await prisma.doctorAssistant.create({
        data: {
          id: da.id,
          doctorId: da.doctorId,
          assistantId: da.assistantId,
          createdAt: new Date(da.createdAt),
        },
      });
    }
    console.log(`✅ Restored ${backupData.doctorAssistants.length} doctor-assistant relationships`);

    // 6. Restore Orders with Teeth migration
    let toothCount = 0;
    for (const order of backupData.orders) {
      // Create order (without per-tooth fields)
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
          clinicId: order.clinicId,
          createdById: order.createdById,
          doctorId: order.doctorId,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          submittedAt: order.submittedAt ? new Date(order.submittedAt) : null,
          materialsSentAt: order.materialsSentAt ? new Date(order.materialsSentAt) : null,
          completedAt: order.completedAt ? new Date(order.completedAt) : null,
        },
      });

      // Create Tooth records from per-tooth fields
      if (order.teethNumbers) {
        const teethArray = order.teethNumbers
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);

        for (const toothNumber of teethArray) {
          await prisma.tooth.create({
            data: {
              orderId: order.id,
              toothNumber: toothNumber,
              material: order.material,
              materialBrand: order.materialBrand,
              colorInfo: order.colorInfo,
              tipoTrabajo: order.tipoTrabajo,
              tipoRestauracion: order.tipoRestauracion,
              trabajoSobreImplante: order.trabajoSobreImplante,
              informacionImplante: order.informacionImplante,
              createdAt: new Date(order.createdAt),
              updatedAt: new Date(order.updatedAt),
            },
          });
          toothCount++;
        }
      }
    }
    console.log(`✅ Restored ${backupData.orders.length} orders`);
    console.log(`✅ Created ${toothCount} tooth records (migrated from order per-tooth fields)`);

    // 7. Restore Files
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
    console.log(`✅ Restored ${backupData.files.length} files`);

    // 8. Restore Alerts
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
    console.log(`✅ Restored ${backupData.alerts.length} alerts`);

    // 9. Restore Order Comments
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
    console.log(`✅ Restored ${backupData.orderComments.length} order comments`);

    // 10. Restore Audit Logs
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
    console.log(`✅ Restored ${backupData.auditLogs.length} audit logs`);

    console.log('\n🎉 Database seed completed successfully!');
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
