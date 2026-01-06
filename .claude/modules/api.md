# API Layer Documentation

**Framework**: Next.js 16 App Router API Routes
**Pattern**: Role-based route segregation
**Validation**: Zod schemas
**Last Updated**: 2026-01-05

## Route Structure

```
/api/
├── [role]/                      # Role-based route segregation
│   ├── lab-admin/              # LAB_ADMIN routes
│   ├── lab-collaborator/       # LAB_COLLABORATOR routes
│   ├── clinic-admin/           # CLINIC_ADMIN routes
│   ├── doctor/                 # DOCTOR routes
│   └── assistant/              # CLINIC_ASSISTANT routes
├── auth/
│   └── [...nextauth]/          # NextAuth.js endpoints
└── alerts/
    └── events/                 # SSE endpoint for real-time alerts
```

## Standard API Route Pattern

**File location**: `src/app/api/[role]/[resource]/[id?]/[action?]/route.ts`

### Example: GET Collection

```typescript
// src/app/api/doctor/orders/route.ts
export async function GET(request: NextRequest) {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Role authorization check
  if (session.user.role !== Role.DOCTOR) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // 3. Organization context check
  const clinicId = session.user.doctorClinicId;
  if (!clinicId) {
    return NextResponse.json({ error: 'Usuario no asociado' }, { status: 400 });
  }

  // 4. Query with filters
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // 5. Access control filter
  const orders = await prisma.order.findMany({
    where: {
      clinicId,                           // Clinic isolation
      doctorId: session.user.id,         // Doctor can only see their orders
      ...(status && { status }),         // Optional filters
    },
    include: {
      doctor: { select: { name: true, email: true } },
      clinic: { select: { name: true } },
      createdBy: { select: { name: true } },
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ orders }, { status: 200 });
}
```

## Validation with Zod

**CRITICAL**: Always use `z.nativeEnum()` for Prisma enums

```typescript
import { z } from 'zod';
import { OrderStatus, ScanType } from '@prisma/client';

// ❌ WRONG - creates separate type
const wrongSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW']),
});

// ✅ CORRECT - uses Prisma enum
const correctSchema = z.object({
  patientName: z.string().min(1, 'Nombre requerido'),
  scanType: z.nativeEnum(ScanType).optional(),
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
});

// In route handler
try {
  const body = await request.json();
  const validatedData = correctSchema.parse(body);
  // Use validatedData...
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      error: 'Validación fallida',
      details: error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    }, { status: 400 });
  }
}
```

## Access Control Helpers

### Order Authorization Helper

**File**: `src/lib/api/orderAuthorization.ts`

```typescript
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

// Automatically checks access based on role and organization
const result = await checkOrderAccess({
  orderId: params.orderId,
  userId: session.user.id,
  userRole: session.user.role,
  laboratoryId: session.user.laboratoryId,
  clinicId: session.user.clinicId,
});

if (!result.hasAccess) {
  return NextResponse.json({ error: result.error }, { status: result.statusCode });
}

const order = result.order; // Pre-fetched and access-verified
```

### Order Creation with Retry

**File**: `src/lib/api/orderCreation.ts`

```typescript
import { createOrderWithRetry } from '@/lib/api/orderCreation';

// Handles race conditions in order number generation
const order = await createOrderWithRetry({
  orderData: {
    ...validatedData,
    clinic: { connect: { id: clinicId } },
    doctor: { connect: { id: doctorId } },
    createdBy: { connect: { id: session.user.id } },
    status: 'DRAFT',
  },
  clinicId,
  patientName: validatedData.patientName,
});
```

### Order Submission Handler

**File**: `src/lib/api/submitOrderHandler.ts`

Shared logic for submitting orders (DRAFT → PENDING_REVIEW)

```typescript
import { submitOrderHandler } from '@/lib/api/submitOrderHandler';

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  return submitOrderHandler({
    orderId: params.orderId,
    request,
    allowedRoles: [Role.DOCTOR, Role.CLINIC_ASSISTANT, Role.CLINIC_ADMIN],
  });
}
```

## HTTP Status Codes

**Standard usage across all API routes:**

- **200**: Success (GET, PUT, DELETE)
- **201**: Created (POST)
- **400**: Bad request (validation errors, business logic errors)
- **401**: Unauthorized (not authenticated)
- **403**: Forbidden (authenticated but not authorized)
- **404**: Not found
- **500**: Internal server error (unexpected errors)

## Error Response Format

**Consistent error structure:**

```typescript
// Simple error
return NextResponse.json({ error: 'Error message' }, { status: 400 });

// Validation errors with details
return NextResponse.json({
  error: 'Validación fallida',
  details: [
    { field: 'patientName', message: 'Nombre requerido' },
    { field: 'scanType', message: 'Tipo de escaneo inválido' },
  ]
}, { status: 400 });
```

## Role-Based Route Access

### LAB_ADMIN Routes
**Base**: `/api/lab-admin/`

- `/clinics` - Manage clinics (CRUD)
- `/users` - Manage all users (create LAB_COLLABORATOR, CLINIC_ADMIN)
- `/orders` - View/manage ALL orders from ALL clinics
- `/alerts` - Send alerts to clinics

### LAB_COLLABORATOR Routes
**Base**: `/api/lab-collaborator/`

- `/orders` - View ALL orders (read-only), update status (IN_PROGRESS, COMPLETED)
- `/alerts` - Send alerts to clinics

### CLINIC_ADMIN Routes
**Base**: `/api/clinic-admin/`

- `/doctors` - Manage doctors in their clinic
- `/assistants` - Manage assistants in their clinic
- `/assistants/{id}/doctors/{doctorId}` - Assign assistants to doctors
- `/orders` - View ALL orders from their clinic, create orders for any doctor

### DOCTOR Routes
**Base**: `/api/doctor/`

- `/orders` - CRUD on their own orders only
- `/orders/{id}/files` - Upload files to their orders
- `/orders/{id}/submit` - Submit order (DRAFT → PENDING_REVIEW)

### CLINIC_ASSISTANT Routes
**Base**: `/api/assistant/`

- `/orders` - CRUD on orders for assigned doctors only
- `/orders/{id}/files` - Upload files
- `/orders/{id}/submit` - Submit order for assigned doctor
- `/doctors` - List assigned doctors

## Query Parameters

**Common patterns:**

```typescript
// Filtering
GET /api/lab-admin/orders?status=PENDING_REVIEW
GET /api/clinic-admin/orders?doctorId=123

// Pagination (if implemented)
GET /api/doctor/orders?page=1&limit=20

// Search
GET /api/lab-admin/clinics?search=dental

// Sorting
GET /api/doctor/orders?sortBy=createdAt&order=desc
```

## Audit Logging

**All important actions should be logged:**

```typescript
import { logOrderEvent, getAuditContext } from '@/lib/audit';

// After successful order status change
await logOrderEvent(
  'STATUS_CHANGE',
  session.user.id,
  orderId,
  { status: oldStatus },
  { status: newStatus },
  getAuditContext(request)
);
```

## Real-Time Updates (SSE)

**Alert events endpoint:**

```typescript
// GET /api/alerts/events?userId={userId}
const eventSource = new EventSource(`/api/alerts/events?userId=${userId}`);

eventSource.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  // Update UI with new alert
};
```

## Common API Patterns

### Creating Related Resources

```typescript
// Create user with clinic relationship
await prisma.user.create({
  data: {
    email: validatedData.email,
    name: validatedData.name,
    role: Role.CLINIC_ADMIN,
    clinic: { connect: { id: clinicId } },  // Establish relationship
  },
});
```

### Updating with Conditional Logic

```typescript
// Only update if state transition is valid
import { canUserTransition } from '@/lib/orderStateMachine';

if (!canUserTransition(session.user.role, currentStatus, newStatus)) {
  return NextResponse.json(
    { error: 'Transición no permitida' },
    { status: 403 }
  );
}

await prisma.order.update({
  where: { id: orderId },
  data: { status: newStatus },
});
```

## Testing API Routes

```bash
# Using curl
curl -X POST http://localhost:3000/api/doctor/orders \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Juan Pérez","scanType":"DIGITAL_SCAN"}'

# Check response status
curl -i http://localhost:3000/api/doctor/orders
```

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/api/orderAuthorization.ts` | Order access control | ~150 |
| `src/lib/api/orderCreation.ts` | Order creation with retry | ~100 |
| `src/lib/api/submitOrderHandler.ts` | Shared submit logic | ~80 |
| `src/lib/orderStateMachine.ts` | State transition validation | ~120 |
| `src/lib/audit.ts` | Audit logging helpers | ~150 |
