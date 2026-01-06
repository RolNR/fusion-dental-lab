# Cloudflare R2 File Storage Integration

**Service**: Cloudflare R2 (S3-compatible object storage)
**SDK**: AWS SDK v3 (S3 client)
**Use Case**: STL files, photos, PDFs for dental orders
**Last Updated**: 2026-01-05

## Why R2?

- **No egress fees** (unlike AWS S3)
- **S3-compatible API** (can use AWS SDK)
- **Global CDN** (automatic via Cloudflare)
- **Low cost** ($0.015/GB storage, no bandwidth charges)

## Configuration

### Environment Variables

```bash
# R2 Credentials
R2_ACCESS_KEY_ID="..."                          # From Cloudflare dashboard
R2_SECRET_ACCESS_KEY="..."                       # From Cloudflare dashboard
R2_ENDPOINT="https://...r2.cloudflarestorage.com" # R2 endpoint URL
R2_BUCKET_NAME="dental-lab-files"                # Bucket name

# Public Access URL
R2_PUBLIC_URL="https://...r2.dev"                # Public bucket URL
NEXT_PUBLIC_R2_PUBLIC_URL="https://...r2.dev"    # Client-side access
```

### S3 Client Setup

**File**: `src/lib/r2.ts` (example)

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return publicUrl;
}
```

## File Upload Flow

```
1. Client submits multipart form data
   ↓
2. API route receives FormData
   ↓
3. Extract file from FormData
   ↓
4. Validate file type & size
   ↓
5. Generate unique storage key (uuid + extension)
   ↓
6. Upload buffer to R2 via AWS SDK
   ↓
7. Store metadata in PostgreSQL File table
   ↓
8. Return public URL to client
```

### Example: Upload API Route

```typescript
// POST /api/doctor/orders/[orderId]/files/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions);
  // ... auth checks

  // 1. Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // 2. Validate file type
  const allowedTypes = ['model/stl', 'image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }

  // 3. Validate file size (e.g., max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Archivo muy grande' }, { status: 400 });
  }

  // 4. Generate unique storage key
  const fileExtension = file.name.split('.').pop();
  const storageKey = `orders/${params.orderId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  // 5. Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 6. Upload to R2
  const storageUrl = await uploadToR2(storageKey, buffer, file.type);

  // 7. Save metadata to database
  const fileRecord = await prisma.file.create({
    data: {
      fileName: `${Date.now()}-${file.name}`,
      originalName: file.name,
      fileType: fileExtension,
      fileSize: file.size,
      mimeType: file.type,
      storageKey,
      storageUrl,
      order: { connect: { id: params.orderId } },
      uploadedBy: { connect: { id: session.user.id } },
    },
  });

  return NextResponse.json({ file: fileRecord }, { status: 201 });
}
```

## File Metadata (Database)

**Model**: `File` (see `database.md`)

```typescript
{
  id: string;
  fileName: string;         // Generated: "1704470400000-file.stl"
  originalName: string;     // User's filename: "upper-jaw.stl"
  fileType: string;         // Extension: "stl"
  fileSize: number;         // Bytes
  mimeType: string;         // "model/stl"
  storageKey: string;       // R2 key: "orders/abc123/1704470400000-uuid.stl"
  storageUrl: string;       // Public URL
  orderId: string;          // FK to Order
  uploadedById: string;     // FK to User
  createdAt: DateTime;
  deletedAt?: DateTime;     // Soft delete
}
```

## Storage Key Patterns

```
orders/{orderId}/{timestamp}-{uuid}.{extension}

Examples:
- orders/clq1a2b3c/1704470400000-550e8400-e29b-41d4-a716-446655440000.stl
- orders/clq1a2b3c/1704470450000-550e8400-e29b-41d4-a716-446655440001.jpg
```

**Benefits**:
- Organized by order
- Unique filenames (no collisions)
- Sortable by timestamp
- Descriptive extension

## File Type Validation

```typescript
const FILE_TYPE_MAP = {
  'model/stl': ['stl'],
  'model/x.stl-binary': ['stl'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
};

function validateFileType(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = FILE_TYPE_MAP[file.type];
  return allowedExtensions?.includes(extension) ?? false;
}
```

## Size Limits

```typescript
const SIZE_LIMITS = {
  stl: 100 * 1024 * 1024,   // 100MB for STL files
  image: 10 * 1024 * 1024,  // 10MB for images
  pdf: 25 * 1024 * 1024,    // 25MB for PDFs
};
```

## File Download

**Public URLs** are directly accessible:

```typescript
// Client-side
<a href={file.storageUrl} download={file.originalName}>
  Descargar {file.originalName}
</a>

// Or in Next.js Image
<Image
  src={file.storageUrl}
  alt={file.originalName}
  width={500}
  height={500}
/>
```

No authentication required for downloads (public bucket).

## File Deletion

### Soft Delete (Recommended)

```typescript
// Mark as deleted in database
await prisma.file.update({
  where: { id: fileId },
  data: { deletedAt: new Date() },
});

// Filter deleted files in queries
where: { deletedAt: null }
```

### Hard Delete (Optional)

```typescript
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

// 1. Delete from R2
await r2Client.send(
  new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: file.storageKey,
  })
);

// 2. Delete from database
await prisma.file.delete({
  where: { id: fileId },
});
```

## CORS Configuration

**On R2 bucket** (via Cloudflare dashboard):

```json
{
  "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

Allows client-side direct access to files.

## Performance Optimization

**Current setup**:
- ✅ Global CDN (Cloudflare automatic)
- ✅ No egress fees
- ✅ Public URLs (no API proxy needed)

**Future optimizations**:
- ⚠️ Signed URLs for private files
- ⚠️ Image optimization/resizing
- ⚠️ Compression for large STL files

## Security Considerations

**Current**:
- Public bucket (anyone with URL can access)
- Storage keys are UUIDs (hard to guess)
- File uploads require authentication

**Future** (if needed):
- Implement signed URLs for time-limited access
- Private bucket with API proxy
- Scan uploaded files for malware

## Error Handling

```typescript
try {
  const storageUrl = await uploadToR2(key, buffer, contentType);
} catch (error) {
  console.error('R2 upload failed:', error);
  return NextResponse.json(
    { error: 'Error al subir archivo' },
    { status: 500 }
  );
}
```

## Monitoring & Costs

**Cloudflare Dashboard**:
- Storage usage (GB)
- Request count (Class A/B operations)
- Bandwidth (free egress)

**Expected costs**:
- Storage: ~$0.015/GB/month
- Requests: ~$0.0036 per 1,000 requests
- Bandwidth: $0 (no egress fees)

## Common Issues

**Upload fails**:
- Check R2 credentials in environment variables
- Verify bucket exists and is accessible
- Check file size limits

**Files not accessible**:
- Verify R2_PUBLIC_URL is correct
- Check bucket is set to public (or use signed URLs)
- Verify CORS configuration

**Slow uploads**:
- R2 endpoint is global, check network latency
- Consider client-side compression for large files
- Monitor request sizes

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/r2.ts` | R2 client and upload helpers |
| `src/app/api/*/orders/[id]/files/route.ts` | File upload endpoints |
| `.env` | R2 credentials and configuration |
