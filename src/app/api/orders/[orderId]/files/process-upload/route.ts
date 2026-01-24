import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import { prisma } from '@/lib/prisma';
import { getPublicUrl } from '@/lib/r2';
import { processImage, requiresProcessing } from '@/lib/imageProcessing';
import { logFileEvent, getAuditContext } from '@/lib/audit';
import { z } from 'zod';
import { FileCategory } from '@/types/file';

const processUploadSchema = z.object({
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  category: z.nativeEnum(FileCategory),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { orderId } = await params;

    // Validate request body
    const body = await request.json();
    const validatedData = processUploadSchema.parse(body);

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

    let thumbnailUrl: string | null = null;
    let isProcessed = false;

    // Process image if needed
    if (requiresProcessing(validatedData.mimeType)) {
      try {
        // Fetch original from R2
        const imageResponse = await fetch(getPublicUrl(validatedData.storageKey));
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Process and upload thumbnail
        const thumbnailKey = await processImage(imageBuffer, validatedData.storageKey);
        thumbnailUrl = getPublicUrl(thumbnailKey);
        isProcessed = true;
      } catch (err) {
        console.error('Image processing failed:', err);
        // Continue without thumbnail - don't fail the upload
        isProcessed = true;
      }
    } else {
      // STL/PLY files don't need processing
      isProcessed = true;
    }

    // Extract file extension
    const fileType = validatedData.fileName.split('.').pop()?.toLowerCase() || '';

    // Save file metadata to database
    const file = await prisma.file.create({
      data: {
        fileName: validatedData.fileName,
        originalName: validatedData.fileName,
        fileType,
        fileSize: validatedData.fileSize,
        mimeType: validatedData.mimeType,
        storageKey: validatedData.storageKey,
        storageUrl: getPublicUrl(validatedData.storageKey),
        category: validatedData.category,
        thumbnailUrl,
        isProcessed,
        orderId,
        uploadedById: session.user.id,
      },
    });

    // Audit log
    await logFileEvent(
      'FILE_UPLOAD',
      session.user.id,
      file.id,
      orderId,
      {
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        category: validatedData.category,
      },
      getAuditContext(request)
    );

    return NextResponse.json({ file }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }

    console.error('Error processing upload:', err);
    return NextResponse.json({ error: 'Error al procesar carga' }, { status: 500 });
  }
}
