import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import { prisma } from '@/lib/prisma';
import { deleteFile as deleteFromR2 } from '@/lib/r2';
import { logFileEvent, getAuditContext } from '@/lib/audit';
import { OrderStatus } from '@prisma/client';
import { THUMBNAIL_SUFFIX } from '@/lib/imageProcessing';
import { captureApiError } from '@/lib/posthog-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { orderId, fileId } = await params;

    // Check order access
    const result = await checkOrderAccess({
      orderId,
      userId: session.user.id,
      userRole: session.user.role,
      laboratoryId: session.user.laboratoryId,
    });

    if (!result.hasAccess) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    // Only allow deletion if order is DRAFT or NEEDS_INFO
    if (
      result.order!.status !== OrderStatus.DRAFT &&
      result.order!.status !== OrderStatus.NEEDS_INFO
    ) {
      return NextResponse.json(
        { error: 'Solo puedes eliminar archivos en órdenes con estado DRAFT o NEEDS_INFO' },
        { status: 403 }
      );
    }

    // Fetch file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.orderId !== orderId) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    // Soft delete in database
    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    // Delete from R2 (async, don't await)
    deleteFromR2(file.storageKey).catch((err) => {
      captureApiError(err, 'Failed to delete file from R2');
    });

    // Also delete thumbnail if exists
    if (file.thumbnailUrl) {
      const thumbnailKey = file.storageKey.replace(/\.[^.]+$/, THUMBNAIL_SUFFIX);
      deleteFromR2(thumbnailKey).catch((err) => {
        captureApiError(err, 'Failed to delete thumbnail from R2');
      });
    }

    // Audit log
    await logFileEvent(
      'FILE_DELETE',
      session.user.id,
      file.id,
      orderId,
      { fileName: file.fileName },
      getAuditContext(request)
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    captureApiError(err, 'Error deleting file');
    return NextResponse.json({ error: 'Error al eliminar archivo' }, { status: 500 });
  }
}
