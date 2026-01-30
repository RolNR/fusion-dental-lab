# API Layer Documentation

**Framework**: Next.js 16 App Router API Routes
**Pattern**: Role-based route segregation
**Validation**: Zod schemas
**Last Updated**: 2026-01-30

## Route Structure

```
/api/
├── lab-admin/              # LAB_ADMIN routes
│   ├── doctors/            # Manage doctors
│   ├── orders/             # View/manage all orders
│   ├── analytics/          # Analytics dashboard data
│   └── alerts/             # Send alerts to doctors
├── doctor/                 # DOCTOR routes
│   ├── orders/             # CRUD on own orders
│   └── alerts/             # View received alerts
├── auth/
│   └── [...nextauth]/      # NextAuth.js endpoints
├── alerts/
│   └── events/             # SSE endpoint for real-time alerts
└── cron/
    └── cleanup-orders/     # Scheduled cleanup endpoint
```

## Standard API Route Pattern

**File location**: `src/app/api/[role]/[resource]/[id?]/[action?]/route.ts`

### Example: GET Collection (Doctor Orders)

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

  // 3. Query with filters + soft-delete filter
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const orders = await prisma.order.findMany({
    where: {
      doctorId: session.user.id,   // Doctor sees only their orders
      deletedAt: null,              // Exclude soft-deleted
      ...(status && { status }),
    },
    include: {
      doctor: { select: { name: true, email: true } },
      files: true,
      teeth: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ orders }, { status: 200 });
}
```

### Example: GET Collection (Lab Admin Orders)

```typescript
// src/app/api/lab-admin/orders/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.LAB_ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const orders = await prisma.order.findMany({
    where: {
      doctor: {
        doctorLaboratoryId: session.user.laboratoryId,  // All doctors in lab
      },
      ...(status && { status }),
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    include: {
      doctor: { select: { name: true, email: true, clinicName: true } },
      files: true,
      teeth: true,
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
import { OrderStatus, CaseType, RestorationType } from '@prisma/client';

// ❌ WRONG - creates separate type
const wrongSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW']),
});

// ✅ CORRECT - uses Prisma enum
const correctSchema = z.object({
  patientName: z.string().min(1, 'Nombre requerido'),
  tipoCaso: z.nativeEnum(CaseType).optional(),
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

const result = await checkOrderAccess({
  orderId: params.orderId,
  userId: session.user.id,
  userRole: session.user.role,
  laboratoryId: session.user.laboratoryId,
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
    doctor: { connect: { id: doctorId } },
    createdBy: { connect: { id: session.user.id } },
    status: 'DRAFT',
  },
  doctorId,
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
    allowedRoles: [Role.DOCTOR, Role.LAB_ADMIN],
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
    { field: 'tipoCaso', message: 'Tipo de caso inválido' },
  ]
}, { status: 400 });
```

## Role-Based Route Access

### LAB_ADMIN Routes
**Base**: `/api/lab-admin/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/doctors` | GET, POST | List/create doctors |
| `/doctors/[id]` | GET, PUT, DELETE | Manage single doctor |
| `/orders` | GET | View ALL orders (with `?includeDeleted=true` option) |
| `/orders/[id]` | PUT | Update order status |
| `/alerts` | POST | Send alerts to doctors |
| `/analytics` | GET | Analytics dashboard data |

### DOCTOR Routes
**Base**: `/api/doctor/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/orders` | GET, POST | List/create own orders |
| `/orders/[id]` | GET, PUT, DELETE | Manage single order |
| `/orders/[id]/files` | POST | Upload files to order |
| `/orders/[id]/submit` | POST | Submit order (DRAFT → PENDING_REVIEW) |
| `/alerts` | GET | View received alerts |

## Query Parameters

**Common patterns:**

```typescript
// Filtering
GET /api/lab-admin/orders?status=PENDING_REVIEW
GET /api/lab-admin/orders?includeDeleted=true

// Search
GET /api/lab-admin/doctors?search=martinez

// Date range (analytics)
GET /api/lab-admin/analytics?startDate=2026-01-01&endDate=2026-01-31

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
  {
    ...getAuditContext(request),
    metadata: {
      aiGenerated: Boolean(order.aiPrompt),
      teethCount: order.teeth.length,
    },
  }
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

## Cron Endpoints

**File**: `src/app/api/cron/cleanup-orders/route.ts`

Scheduled cleanup of completed orders (soft-delete + R2 file deletion):

```typescript
// Requires CRON_SECRET header
POST /api/cron/cleanup-orders
POST /api/cron/cleanup-orders?dryRun=true  // Preview only
```

Configured in `vercel.json` for daily execution.

## Common API Patterns

### Creating Related Resources

```typescript
// Create doctor with laboratory relationship
await prisma.user.create({
  data: {
    email: validatedData.email,
    name: validatedData.name,
    role: Role.DOCTOR,
    doctorLaboratory: { connect: { id: laboratoryId } },
    clinicName: validatedData.clinicName,
  },
});
```

### Updating with State Machine Validation

```typescript
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

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/api/orderAuthorization.ts` | Order access control |
| `src/lib/api/orderCreation.ts` | Order creation with retry |
| `src/lib/api/submitOrderHandler.ts` | Shared submit logic |
| `src/lib/api/orderStatusUpdate.ts` | Status update with audit |
| `src/lib/orderStateMachine.ts` | State transition validation |
| `src/lib/audit.ts` | Audit logging helpers |
| `src/lib/analytics.ts` | Analytics query functions |
