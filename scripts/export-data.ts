import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Exporting data from database...');

    // Export all data
    const laboratories = await prisma.laboratory.findMany();
    const users = await prisma.user.findMany();
    const orders = await prisma.order.findMany();
    const teeth = await prisma.tooth.findMany();
    const files = await prisma.file.findMany();
    const alerts = await prisma.alert.findMany();
    const auditLogs = await prisma.auditLog.findMany();
    const orderComments = await prisma.orderComment.findMany();

    const data = {
      laboratories,
      users,
      orders,
      teeth,
      files,
      alerts,
      auditLogs,
      orderComments,
      exportedAt: new Date().toISOString(),
    };

    // Save to file
    const exportPath = path.join(process.cwd(), 'data-backup.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

    console.log(`Data exported successfully to ${exportPath}`);
    console.log(`   - ${laboratories.length} laboratories`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${orders.length} orders`);
    console.log(`   - ${teeth.length} teeth`);
    console.log(`   - ${files.length} files`);
    console.log(`   - ${alerts.length} alerts`);
    console.log(`   - ${auditLogs.length} audit logs`);
    console.log(`   - ${orderComments.length} order comments`);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
