import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import { generateStorageKey, generateUploadUrl } from '@/lib/r2';
import { z } from 'zod';
import {
  FileCategory,
  ALLOWED_SCAN_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_OTHER_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
  MAX_OTHER_SIZE_MB,
} from '@/types/file';

const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'El nombre del archivo es requerido'),
  fileSize: z.number().positive('El tamaño del archivo debe ser positivo'),
  mimeType: z.string().min(1, 'El tipo MIME es requerido'),
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
    const validatedData = uploadUrlSchema.parse(body);

    // Check order access
    const result = await checkOrderAccess({
      orderId,
      userId: session.user.id,
      userRole: session.user.role,
      laboratoryId: session.user.laboratoryId,
      clinicId: session.user.clinicId,
    });

    if (!result.hasAccess) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    // Validate file type based on category
    const ext = '.' + validatedData.fileName.split('.').pop()?.toLowerCase();

    if (validatedData.category === FileCategory.PHOTOGRAPH) {
      if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
        return NextResponse.json(
          { error: `Tipo de archivo no válido. Se aceptan: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
    } else if (
      validatedData.category === FileCategory.SCAN_UPPER ||
      validatedData.category === FileCategory.SCAN_LOWER
    ) {
      if (!ALLOWED_SCAN_TYPES.includes(ext)) {
        return NextResponse.json(
          {
            error: `Tipo de archivo no válido para archivos 3D. Se aceptan: ${ALLOWED_SCAN_TYPES.join(', ')}`,
          },
          { status: 400 }
        );
      }
    } else if (validatedData.category === FileCategory.OTHER) {
      const allAllowedTypes = [
        ...ALLOWED_SCAN_TYPES,
        ...ALLOWED_IMAGE_TYPES,
        ...ALLOWED_OTHER_TYPES,
      ];
      if (!allAllowedTypes.includes(ext)) {
        return NextResponse.json(
          {
            error: `Tipo de archivo no válido. Se aceptan: ${allAllowedTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate file size
    let maxSizeMB: number;
    if (validatedData.category === FileCategory.PHOTOGRAPH) {
      maxSizeMB = MAX_IMAGE_SIZE_MB;
    } else if (
      validatedData.category === FileCategory.SCAN_UPPER ||
      validatedData.category === FileCategory.SCAN_LOWER
    ) {
      maxSizeMB = MAX_FILE_SIZE_MB;
    } else {
      maxSizeMB = MAX_OTHER_SIZE_MB;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (validatedData.fileSize > maxSizeBytes) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate storage key and pre-signed URL
    const storageKey = generateStorageKey(orderId, validatedData.category, validatedData.fileName);

    const uploadUrl = await generateUploadUrl(
      storageKey,
      validatedData.mimeType,
      300 // 5 minutes
    );

    return NextResponse.json(
      {
        uploadUrl,
        storageKey,
        fileName: validatedData.fileName,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }

    console.error('Error generating upload URL:', err);
    return NextResponse.json({ error: 'Error al generar URL de carga' }, { status: 500 });
  }
}
