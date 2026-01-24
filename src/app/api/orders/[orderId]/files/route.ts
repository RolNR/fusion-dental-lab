import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { orderId } = await params;

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

    // Fetch all files for this order
    const files = await prisma.file.findMany({
      where: {
        orderId,
        deletedAt: null, // Exclude soft-deleted files
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        mimeType: true,
        storageUrl: true,
        thumbnailUrl: true,
        category: true,
        isProcessed: true,
        createdAt: true,
        uploadedBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ files }, { status: 200 });
  } catch (err) {
    console.error('Error fetching files:', err);
    return NextResponse.json({ error: 'Error al cargar archivos' }, { status: 500 });
  }
}
