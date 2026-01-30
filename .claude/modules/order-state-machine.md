# Order State Machine

**File**: `src/lib/orderStateMachine.ts`
**Purpose**: Enforce valid order status transitions based on user role
**Last Updated**: 2026-01-30

## Status Flow Diagram

```
DRAFT ──────────────────┐
  ↓                     ↓
PENDING_REVIEW      CANCELLED
  ↓         ↓
  ↓    NEEDS_INFO ──────┐
  ↓         ↓           ↓
  ↓    MATERIALS_SENT   ↓
  ↓         ↓           ↓
IN_PROGRESS ←──────────┘
  ↓
COMPLETED
```

## Status Definitions

| Status | Description | Who can set |
|--------|-------------|-------------|
| `DRAFT` | Order being created | DOCTOR (auto on create) |
| `PENDING_REVIEW` | Submitted to lab | DOCTOR (submit action) |
| `NEEDS_INFO` | Lab needs more info | LAB_ADMIN |
| `MATERIALS_SENT` | Physical materials sent | DOCTOR (optional) |
| `IN_PROGRESS` | Lab working on order | LAB_ADMIN |
| `COMPLETED` | Work finished | LAB_ADMIN |
| `CANCELLED` | Order cancelled | LAB_ADMIN (any status), DOCTOR (from DRAFT only) |

## Two-Role Transitions

### DOCTOR

**Can transition:**
- `DRAFT` → `PENDING_REVIEW` (submit order)
- `DRAFT` → `CANCELLED` (cancel before submit)
- `NEEDS_INFO` → `PENDING_REVIEW` (respond to lab request)
- `PENDING_REVIEW` → `MATERIALS_SENT` (optional)

**Cannot transition:**
- Cannot set `IN_PROGRESS` or `COMPLETED` (only lab admin can)
- Cannot cancel after submission (only LAB_ADMIN can)

### LAB_ADMIN

**Can transition:**
- `PENDING_REVIEW` → `IN_PROGRESS` (start work)
- `PENDING_REVIEW` → `NEEDS_INFO` (request more info)
- `IN_PROGRESS` → `COMPLETED` (finish work)
- `IN_PROGRESS` → `NEEDS_INFO` (need more info during work)
- `NEEDS_INFO` → `IN_PROGRESS` (if info received)
- **Any status** → `CANCELLED` (admin override)
- **All transitions allowed** (admin override)

## State Machine Implementation

**File**: `src/lib/orderStateMachine.ts`

### Check if Transition is Valid

```typescript
import { canUserTransition } from '@/lib/orderStateMachine';
import { Role, OrderStatus } from '@prisma/client';

const isValid = canUserTransition(
  userRole: Role,
  currentStatus: OrderStatus,
  newStatus: OrderStatus
);

if (!isValid) {
  return NextResponse.json(
    { error: 'Transición no permitida' },
    { status: 403 }
  );
}
```

### Get Valid Next States

```typescript
import { getValidNextStatesForRole } from '@/lib/orderStateMachine';

const validStates = getValidNextStatesForRole(
  session.user.role,
  order.status
);

// Returns: OrderStatus[]
// Example: [OrderStatus.IN_PROGRESS, OrderStatus.NEEDS_INFO]
```

### Usage in API Routes

```typescript
// PUT /api/lab-admin/orders/[orderId]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  // Fetch current order
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });

  // Check if transition is allowed
  if (!canUserTransition(session.user.role, order.status, body.status)) {
    return NextResponse.json(
      { error: 'No puedes cambiar a este estado' },
      { status: 403 }
    );
  }

  // Update order
  const updated = await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: body.status,
      ...(body.status === OrderStatus.COMPLETED && { completedAt: new Date() }),
    },
  });

  // Log transition
  await logOrderEvent(
    'STATUS_CHANGE',
    session.user.id,
    order.id,
    { status: order.status },
    { status: body.status },
    getAuditContext(request)
  );

  return NextResponse.json({ order: updated });
}
```

## State Machine Rules

### Rule Matrix

| From Status | To Status | DOCTOR | LAB_ADMIN |
|-------------|-----------|--------|-----------|
| DRAFT | PENDING_REVIEW | ✅ | ✅ |
| DRAFT | CANCELLED | ✅ | ✅ |
| PENDING_REVIEW | IN_PROGRESS | ❌ | ✅ |
| PENDING_REVIEW | NEEDS_INFO | ❌ | ✅ |
| PENDING_REVIEW | MATERIALS_SENT | ✅ | ✅ |
| NEEDS_INFO | PENDING_REVIEW | ✅ | ✅ |
| NEEDS_INFO | IN_PROGRESS | ❌ | ✅ |
| MATERIALS_SENT | IN_PROGRESS | ❌ | ✅ |
| IN_PROGRESS | COMPLETED | ❌ | ✅ |
| IN_PROGRESS | NEEDS_INFO | ❌ | ✅ |
| * | CANCELLED | ❌ | ✅ |

### Special Rules

**LAB_ADMIN bypass**:
- Can force any transition (admin override)
- Used for error correction and special cases

**Timestamp updates**:
```typescript
// On PENDING_REVIEW (first time)
if (newStatus === OrderStatus.PENDING_REVIEW && !order.submittedAt) {
  data.submittedAt = new Date();
}

// On COMPLETED
if (newStatus === OrderStatus.COMPLETED) {
  data.completedAt = new Date();
}
```

## UI Integration

### Status Badge Component

```typescript
// Display color-coded status
const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_REVIEW: 'bg-warning/10 text-warning',
  NEEDS_INFO: 'bg-danger/10 text-danger',
  MATERIALS_SENT: 'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-primary text-primary-foreground',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-gray-200 text-gray-600',
};
```

### Status Dropdown (with validation)

```typescript
const validStates = getValidNextStatesForRole(userRole, currentStatus);

<Select value={status} onChange={handleChange}>
  {validStates.map((state) => (
    <option key={state} value={state}>
      {statusLabels[state]}
    </option>
  ))}
</Select>
```

## Status Labels (Spanish)

```typescript
const statusLabels = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'Pendiente de revisión',
  NEEDS_INFO: 'Necesita información',
  MATERIALS_SENT: 'Materiales enviados',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};
```

## Common Workflows

### Order Submission (Doctor → Lab)

```
1. Doctor creates order (status: DRAFT)
2. Doctor fills order details, uploads files
3. Doctor submits order
   ↓
   API checks: canUserTransition(DOCTOR, DRAFT, PENDING_REVIEW) ✅
   ↓
4. Status → PENDING_REVIEW
5. submittedAt timestamp set
6. Lab admin sees order in queue
```

### Lab Starts Work

```
1. Lab admin views PENDING_REVIEW orders
2. Clicks "Start Work"
   ↓
   API checks: canUserTransition(LAB_ADMIN, PENDING_REVIEW, IN_PROGRESS) ✅
   ↓
3. Status → IN_PROGRESS
4. Order visible in lab's active work queue
```

### Lab Needs More Info

```
1. Lab admin sees PENDING_REVIEW order is incomplete
2. Clicks "Request Info" with message
   ↓
   API checks: canUserTransition(LAB_ADMIN, PENDING_REVIEW, NEEDS_INFO) ✅
   ↓
3. Status → NEEDS_INFO
4. Alert sent to doctor
5. Doctor responds with info
6. Doctor submits again → PENDING_REVIEW
```

### Order Completion

```
1. Lab admin finishes work (status: IN_PROGRESS)
2. Lab admin marks complete
   ↓
   API checks: canUserTransition(LAB_ADMIN, IN_PROGRESS, COMPLETED) ✅
   ↓
3. Status → COMPLETED
4. completedAt timestamp set
5. Alert sent to doctor
```

## Error Prevention

**State machine prevents**:
- Doctors from marking orders completed
- Doctors from starting work on orders
- Backwards transitions (COMPLETED → DRAFT)
- Invalid status jumps (DRAFT → COMPLETED)
- Unauthorized cancellations (doctors can't cancel submitted orders)

**Audit trail captures**:
- Who changed status
- When it changed
- Old and new values
- IP address and user agent

## Testing State Transitions

```typescript
// Test valid transition
expect(canUserTransition(Role.DOCTOR, 'DRAFT', 'PENDING_REVIEW')).toBe(true);

// Test invalid transition
expect(canUserTransition(Role.DOCTOR, 'DRAFT', 'COMPLETED')).toBe(false);

// Test admin override
expect(canUserTransition(Role.LAB_ADMIN, 'COMPLETED', 'DRAFT')).toBe(true);
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/orderStateMachine.ts` | State machine logic |
| `src/lib/api/submitOrderHandler.ts` | Shared submit logic |
| `src/lib/api/orderStatusUpdate.ts` | Status update with audit |
| `src/app/api/*/orders/[id]/route.ts` | API routes using validation |
| `src/components/orders/OrderStatusBadge.tsx` | UI component |
