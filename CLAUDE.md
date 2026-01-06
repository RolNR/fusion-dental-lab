# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LabWiseLink** - Multi-tenant dental lab order management platform connecting ONE laboratory with multiple dental clinics.

- **Tech Stack**: Next.js 16 (App Router), TypeScript, Prisma 6, PostgreSQL, NextAuth.js, Tailwind CSS 4, Cloudflare R2
- **Language**: All user-facing content MUST be in Spanish
- **Authentication**: JWT sessions (30-day expiry), role-based access control
- **Business Model**: Single laboratory manages multiple clinics as clients

## Development Commands

```bash
# Development
npm run dev                    # Start dev server with Turbopack (hostname 0.0.0.0)
npm run build                  # Production build (MUST pass before commits)
npm run start                  # Start production server

# Database
npm run db:generate            # Generate Prisma Client
npm run db:push               # Push schema to database (dev only)
npm run db:migrate            # Create migration (before production deploy)
npm run db:studio             # Open Prisma Studio on localhost:5555

# Code Quality
npm run lint                  # Run ESLint
npm run format                # Format with Prettier (includes Tailwind class sorting)

# Initial Setup
npm run create-lab-admin      # Interactive CLI to create Laboratory + LAB_ADMIN user
```

## Multi-Tenant Architecture

### Organizational Hierarchy

```
Laboratory (single instance)
  ├── Lab Admins (manage everything)
  ├── Lab Collaborators (view orders, read-only)
  └── Clinics (multiple)
      ├── Clinic Admins (manage clinic users)
      ├── Doctors (create own orders)
      └── Clinic Assistants (create orders for assigned doctors)
```

### Five Roles Explained

**1. LAB_ADMIN** - Super admin of laboratory
- Creates/manages clinics and lab collaborators
- Views ALL orders from ALL clinics
- Full CRUD on everything
- Database: `user.laboratoryId → Laboratory.id`

**2. LAB_COLLABORATOR** - Lab employee (read-only)
- Views all orders (read-only)
- Updates order status (IN_PROGRESS, COMPLETED)
- Sends alerts to clinics
- Database: `user.labCollaboratorId → Laboratory.id`

**3. CLINIC_ADMIN** - Clinic administrator
- Creates/manages doctors and assistants for their clinic
- Assigns assistants to doctors
- Views ALL orders from their clinic
- Creates orders for any doctor
- Database: `user.clinicId → Clinic.id`

**4. DOCTOR** - Dentist
- Creates orders (auto-assigned to self)
- Views ONLY their own orders
- Uploads files, submits orders
- Database: `user.doctorClinicId → Clinic.id`

**5. CLINIC_ASSISTANT** - Dental assistant
- Creates orders ON BEHALF of assigned doctors
- Views orders of assigned doctors only
- Many-to-many assignment via `DoctorAssistant` table
- Database: `user.assistantClinicId → Clinic.id`

### Key Database Relationships

```typescript
// Order ownership
Order.doctorId → User.id (doctor who owns the order)
Order.createdById → User.id (who created it - doctor/assistant/clinic_admin)
Order.clinicId → Clinic.id

// Doctor-Assistant assignment
DoctorAssistant {
  doctorId → User.id
  assistantId → User.id
  unique([doctorId, assistantId])
}

// User organizational links (mutually exclusive)
User.laboratoryId → Laboratory.id (LAB_ADMIN)
User.labCollaboratorId → Laboratory.id (LAB_COLLABORATOR)
User.clinicId → Clinic.id (CLINIC_ADMIN)
User.doctorClinicId → Clinic.id (DOCTOR)
User.assistantClinicId → Clinic.id (CLINIC_ASSISTANT)
```

## Order State Machine

### Status Flow

```
DRAFT → PENDING_REVIEW → IN_PROGRESS → COMPLETED
  ↓           ↓              ↓
CANCELLED   NEEDS_INFO ────→ (cycles back)
            MATERIALS_SENT
```

### Role-Based Transitions

**Clinic users (DOCTOR/CLINIC_ASSISTANT/CLINIC_ADMIN):**
- `DRAFT → PENDING_REVIEW` (submit)
- `NEEDS_INFO → PENDING_REVIEW` (respond to lab)

**Lab users (LAB_COLLABORATOR):**
- `PENDING_REVIEW → IN_PROGRESS` (start work)
- `PENDING_REVIEW → NEEDS_INFO` (request info)
- `IN_PROGRESS → COMPLETED` (finish)

**LAB_ADMIN:** Can force any transition including CANCELLED

### State Machine Enforcement

```typescript
// File: src/lib/orderStateMachine.ts
import { canUserTransition, getValidNextStatesForRole } from '@/lib/orderStateMachine';

// Check if transition allowed
if (!canUserTransition(userRole, currentStatus, newStatus)) {
  return NextResponse.json({ error: 'Transición no permitida' }, { status: 403 });
}

// Get valid next states for UI
const validStates = getValidNextStatesForRole(userRole, currentStatus);
```

## API Route Patterns

### Structure

```
/api/[role]/[resource]/[id?]/[action?]/route.ts
```

### Standard CRUD Pattern

```typescript
// GET collection with auth + filters
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Auth check
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Role check
  if (session.user.role !== Role.EXPECTED_ROLE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Organization check
  const organizationId = session.user.laboratoryId || session.user.clinicId;
  if (!organizationId) {
    return NextResponse.json({ error: 'Usuario no asociado' }, { status: 400 });
  }

  // Query with filters
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const records = await prisma.model.findMany({
    where: {
      organizationId,
      ...(status && { status }),
    },
    include: { /* related data */ },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ records }, { status: 200 });
}
```

### Zod Validation

```typescript
import { z } from 'zod';
import { OrderStatus, ScanType } from '@prisma/client';

// IMPORTANT: Use z.nativeEnum() for Prisma enums
const schema = z.object({
  patientName: z.string().min(1, 'Nombre requerido'),
  scanType: z.nativeEnum(ScanType).optional(), // NOT z.enum(['DIGITAL_SCAN', ...])
  status: z.nativeEnum(OrderStatus),
});

// In route handler
try {
  const body = await request.json();
  const validatedData = schema.parse(body);
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

### Order Access Control

```typescript
// File: src/lib/api/orderAuthorization.ts
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

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

const order = result.order; // Pre-fetched with access verified
```

### Order Creation with Retry

```typescript
// File: src/lib/api/orderCreation.ts
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

## Authentication Helpers

### Server Components

```typescript
// File: src/lib/auth-helpers.ts
import { requireAuth, requireRole, getCurrentUser } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

// Require any auth (redirects to /auth/login if not authenticated)
const session = await requireAuth();

// Require specific role(s) (redirects to /unauthorized if wrong role)
const session = await requireRole([Role.LAB_ADMIN, Role.LAB_COLLABORATOR]);

// Optional auth check (returns null if not authenticated)
const user = await getCurrentUser();
```

### Middleware Protection

**File**: `src/middleware.ts` - Protects all routes except home, auth, API auth, and static assets

- Redirects to `/auth/login` if not authenticated
- Redirects to `/unauthorized` if wrong role for path prefix
- Path-role mapping:
  - `/lab-admin/*` → LAB_ADMIN
  - `/lab-collaborator/*` → LAB_COLLABORATOR
  - `/clinic-admin/*` → CLINIC_ADMIN
  - `/doctor/*` → DOCTOR
  - `/assistant/*` → CLINIC_ASSISTANT

## UI Component System

### CRITICAL RULES

1. **ALWAYS use custom UI components** - Never create inline `<input>`, `<select>`, `<button>`, `<textarea>`
2. **ALL icons in Icons.tsx** - Never inline `<svg>` elements
3. **ALWAYS use semantic colors** - Never hardcoded colors like `bg-blue-600`, `text-gray-900`

### Core Components

```typescript
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

// Input with label, error, helper text
<Input
  label="Correo electrónico"
  required
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  error={errors.email}
  placeholder="tu@ejemplo.com"
/>

// Password with show/hide toggle
<PasswordInput
  label="Contraseña"
  required
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  error={errors.password}
/>

// Select dropdown
<Select
  label="Rol"
  required
  value={formData.role}
  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
  error={errors.role}
>
  <option value="">Selecciona una opción</option>
  <option value="option1">Opción 1</option>
</Select>

// Button with variants and loading state
<Button
  type="submit"
  variant="primary" // primary | secondary | danger | ghost
  size="md"         // sm | md | lg
  isLoading={isLoading}
>
  Guardar
</Button>

// Icons (centralized)
<Icons.alertCircle className="h-6 w-6 text-warning" />
<Icons.spinner className="h-4 w-4 animate-spin" />
```

### Available Icons

```typescript
Icons.spinner, Icons.check, Icons.x, Icons.alertCircle
Icons.eye, Icons.eyeOff
Icons.user, Icons.mail, Icons.lock
// Add new icons to src/components/ui/Icons.tsx
```

## Design System - Semantic Colors

### NEVER Use Hardcoded Colors

```tsx
// ❌ WRONG - Hardcoded colors
<button className="bg-blue-600 text-white hover:bg-blue-700">
<div className="text-gray-900 bg-gray-100">
<input className="border-gray-300 focus:ring-blue-500">

// ✅ CORRECT - Semantic colors
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
<div className="text-foreground bg-muted">
<input className="border-border-input focus:ring-primary">
```

### Semantic Color Classes

**Primary (brand actions):**
- `bg-primary`, `text-primary`, `border-primary`, `focus:ring-primary`
- `bg-primary-hover`, `text-primary-foreground`

**Danger (errors, delete):**
- `bg-danger`, `text-danger`, `border-danger`
- `bg-danger-hover`, `text-danger-foreground`
- `bg-danger/10` (light error background)

**Success:**
- `bg-success`, `text-success`, `bg-success/10`

**Warning:**
- `bg-warning`, `text-warning`, `bg-warning/10`

**UI/Neutral:**
- `bg-background`, `text-foreground` (main content)
- `bg-muted`, `text-muted-foreground` (secondary)
- `border-border`, `border-border-input`

### Common UI Patterns

```tsx
// Error message
{error && (
  <div className="rounded-md bg-danger/10 p-4">
    <p className="text-sm text-danger">{error}</p>
  </div>
)}

// Success message
{success && (
  <div className="rounded-md bg-success/10 p-6">
    <p className="text-sm text-success">{message}</p>
  </div>
)}

// Card container
<div className="rounded-lg bg-background p-6 shadow border border-border">
  <h2 className="text-lg font-semibold text-foreground mb-4">Título</h2>
  <p className="text-sm text-muted-foreground">Contenido</p>
</div>

// Page layout
<div className="min-h-screen bg-muted py-12 px-4">
  <div className="mx-auto max-w-7xl">
    <h1 className="text-3xl font-bold text-foreground">Título</h1>
    <p className="mt-2 text-muted-foreground">Descripción</p>
  </div>
</div>
```

## Spanish Language Requirement

**ALL user-facing content MUST be in Spanish.**

### Common Translations

```typescript
// UI Text
Login → Iniciar sesión
Sign up → Registrarse
Email → Correo electrónico
Password → Contraseña
Submit → Enviar
Cancel → Cancelar
Save → Guardar
Delete → Eliminar
Edit → Editar
Create → Crear
Update → Actualizar
Loading → Cargando

// Validation
"El correo electrónico es requerido"
"La contraseña debe tener al menos 8 caracteres"
"Campo requerido"
"Formato de correo inválido"

// Status Messages
"Orden creada exitosamente"
"Error al crear orden"
"Procesando..."
```

## Audit Logging

```typescript
// File: src/lib/audit.ts
import { logAuthEvent, logOrderEvent, getAuditContext } from '@/lib/audit';

// Auth events
await logAuthEvent('LOGIN', userId, email, {
  ...getAuditContext(request),
  metadata: { name: user.name },
});

// Order events (with old/new values)
await logOrderEvent('STATUS_CHANGE', userId, orderId,
  { status: oldStatus },
  { status: newStatus },
  getAuditContext(request)
);

// Get context from NextRequest
const context = getAuditContext(request);
// Returns: { ipAddress, userAgent }
```

## File Storage (Cloudflare R2)

### Environment Variables

```env
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://...r2.cloudflarestorage.com"
R2_BUCKET_NAME="dental-lab-files"
R2_PUBLIC_URL="https://...r2.dev"
NEXT_PUBLIC_R2_PUBLIC_URL="https://...r2.dev"
```

### File Upload Pattern

1. Client uploads multipart form data
2. Server validates file (type, size)
3. Generate unique storage key
4. Upload to R2 using AWS SDK
5. Store metadata in PostgreSQL `File` table
6. Return public URL to client

### File Metadata

```typescript
File {
  fileName: string;        // Generated unique name
  originalName: string;    // User's original filename
  fileType: string;        // Extension (stl, jpg, pdf)
  fileSize: number;        // Bytes
  mimeType: string;        // MIME type
  storageKey: string;      // R2 object key (unique)
  storageUrl: string;      // Public URL
  orderId: string;         // FK to Order
  uploadedById: string;    // FK to User
  createdAt: DateTime;
  expiresAt?: DateTime;    // Optional auto-cleanup
  deletedAt?: DateTime;    // Soft delete
}
```

## Code Quality Checklist

### Before Committing

1. ✅ Use custom UI components (Input, PasswordInput, Select, Button)
2. ✅ All icons in Icons.tsx (no inline SVG)
3. ✅ Semantic colors only (no hardcoded colors)
4. ✅ Spanish language for all user-facing text
5. ✅ Zod validation with `z.nativeEnum()` for Prisma enums
6. ✅ Proper error handling (401/403/400/500 status codes)
7. ✅ TypeScript strict mode (no `any`, use `unknown` in catch blocks)
8. ✅ Audit logging for important actions
9. ✅ **Run `npm run build` - MUST PASS**

### Error Handling HTTP Status Codes

- `200`: Success (GET, PUT, DELETE)
- `201`: Created (POST)
- `400`: Bad request (validation errors, business logic errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (authenticated but not authorized)
- `404`: Not found
- `500`: Internal server error (unexpected errors)

## Key Workflows

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Fill in DATABASE_URL, R2_*, NEXTAUTH_SECRET (openssl rand -base64 32)

# 3. Push schema to database
npm run db:push

# 4. Create laboratory + admin user
npm run create-lab-admin
```

### Creating Data Hierarchy

1. **LAB_ADMIN creates clinic**: `POST /api/lab-admin/clinics`
2. **LAB_ADMIN creates CLINIC_ADMIN**: `POST /api/lab-admin/users` with `clinicId`
3. **CLINIC_ADMIN creates doctors**: `POST /api/clinic-admin/doctors`
4. **CLINIC_ADMIN creates assistants**: `POST /api/clinic-admin/assistants`
5. **CLINIC_ADMIN assigns assistants to doctors**: `POST /api/clinic-admin/assistants/{assistantId}/doctors/{doctorId}`

### Order Lifecycle

1. **Doctor/Assistant creates order**: `POST /api/doctor/orders` → Status: `DRAFT`
2. **Upload files** (optional): Multipart upload to R2
3. **Submit order**: `POST /api/doctor/orders/{orderId}/submit` → Status: `PENDING_REVIEW`
4. **Lab reviews**: Visible in `/lab-admin/orders` or `/lab-collaborator/orders`
5. **Lab accepts**: `PUT /api/lab-admin/orders/{orderId}` → Status: `IN_PROGRESS`
6. **Lab completes**: `PUT /api/lab-admin/orders/{orderId}` → Status: `COMPLETED`

**If info needed:**
- Lab: `PUT /api/lab-admin/orders/{orderId}` → Status: `NEEDS_INFO`
- Clinic responds: `PUT /api/doctor/orders/{orderId}` → Status: `PENDING_REVIEW`

## Common Gotchas

### Prisma Enum Validation

```typescript
// ❌ WRONG - Creates separate enum type
const schema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'COMPLETED']),
});

// ✅ CORRECT - Uses Prisma enum type
import { OrderStatus } from '@prisma/client';
const schema = z.object({
  status: z.nativeEnum(OrderStatus),
});
```

### User Organization IDs

Users have **multiple nullable organization fields** - only ONE should be populated:

```typescript
// LAB_ADMIN
user.laboratoryId !== null
user.labCollaboratorId === null
user.clinicId === null
user.doctorClinicId === null
user.assistantClinicId === null

// DOCTOR
user.laboratoryId === null
user.labCollaboratorId === null
user.clinicId === null
user.doctorClinicId !== null  // Links to Clinic
user.assistantClinicId === null
```

### Order doctorId vs createdById

```typescript
// DOCTOR creates own order
order.doctorId = session.user.id
order.createdById = session.user.id

// ASSISTANT creates order for doctor
order.doctorId = selectedDoctorId  // Must be assigned to this doctor
order.createdById = session.user.id // Assistant's ID

// CLINIC_ADMIN creates order
order.doctorId = selectedDoctorId  // Any doctor in clinic
order.createdById = session.user.id // Clinic admin's ID
```

## Important Files & Locations

### Key Utilities

- `src/lib/auth-helpers.ts` - Server-side auth helpers
- `src/lib/orderStateMachine.ts` - Order status transitions
- `src/lib/api/orderAuthorization.ts` - Order access control
- `src/lib/api/orderCreation.ts` - Order creation with retry logic
- `src/lib/api/submitOrderHandler.ts` - Shared submit logic
- `src/lib/audit.ts` - Audit logging helpers
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/auth.ts` - NextAuth configuration

### Component Organization

```
src/components/
├── ui/                  # Shared primitives (ALWAYS use these)
├── lab-admin/          # Lab admin specific
├── lab-collaborator/   # Lab collaborator specific
├── clinic-admin/       # Clinic admin specific
├── clinic-staff/       # Shared by DOCTOR + CLINIC_ASSISTANT
├── orders/             # Order-related (shared)
└── providers/          # Context providers
```

### Route Structure

```
src/app/
├── (auth)/
│   └── auth/
│       ├── login/page.tsx
│       └── error/page.tsx
├── lab-admin/
│   ├── page.tsx                    # Dashboard
│   ├── clinics/
│   ├── users/
│   └── orders/
├── lab-collaborator/
│   └── orders/
├── clinic-admin/
│   ├── page.tsx                    # Dashboard
│   ├── doctors/
│   ├── assistants/
│   └── orders/
├── doctor/
│   ├── page.tsx                    # Dashboard
│   └── orders/
└── assistant/
    ├── page.tsx                    # Dashboard
    └── orders/
```

## Documentation

- `README.md` - Project setup and overview
- `docs/deployment-guide.md` - Complete deployment instructions (Vercel + Neon + R2)
- `docs/design-system.md` - Design system details
- `docs/new-business-model.md` - Multi-tenant architecture design
- `.claude/instructions.md` - Detailed component usage and conventions
- `CODE_REVIEW_CHECKLIST.md` - Code quality checklist

## Real-Time Features

### Server-Sent Events (SSE)

```typescript
// Alert event bus: src/lib/sse/eventBus.ts
import { eventBus } from '@/lib/sse/eventBus';

// When alert created, emit event
eventBus.emit('newAlert', alertPayload);

// Client subscribes
const eventSource = new EventSource(`/api/alerts/events?userId=${userId}`);
eventSource.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  // Update UI
};
```

### Toast Notifications

```typescript
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

showToast('Orden creada exitosamente', 'success');
showToast('Error al guardar', 'error');
showToast('Procesando...', 'info');
showToast('Advertencia', 'warning');
```

## Architecture Summary

LabWiseLink is a **multi-tenant dental lab platform** where:

1. **One Laboratory** owns the deployment
2. Laboratory manages **multiple Clinics** as clients
3. **Five roles** with hierarchical access:
   - LAB_ADMIN (full control)
   - LAB_COLLABORATOR (read-only orders)
   - CLINIC_ADMIN (manages clinic users)
   - DOCTOR (creates own orders)
   - CLINIC_ASSISTANT (creates orders for assigned doctors)
4. **Orders flow** through a state machine (DRAFT → PENDING_REVIEW → IN_PROGRESS → COMPLETED)
5. **Access control** enforced at API, middleware, and database levels
6. **Audit logging** tracks all important actions
7. **File storage** in Cloudflare R2 with metadata in PostgreSQL
8. **Real-time alerts** via Server-Sent Events
9. **Semantic design system** for easy theming

**Total codebase**: ~14,500 lines of TypeScript across 152 files.

## Claude Cognitive - Context Management System

This project uses **Claude Cognitive** for intelligent context management and multi-instance coordination.

### What It Does

Claude Cognitive provides:
- **Context Router**: Automatically manages which files stay in context (HOT/WARM/COLD)
- **Pool Coordinator**: Allows multiple Claude instances to share work status and avoid duplicate work
- **Token Savings**: Reduces token usage by 50-95% through intelligent file attention tracking

### Context Documentation Structure

The project uses **fractal documentation** in `.claude/` directory:

**Systems** (`.claude/systems/`)
- Hardware, deployment, infrastructure
- Changes slowly
- Example: production environment, development setup

**Modules** (`.claude/modules/`)
- Core code systems documentation
- Changes frequently
- Example: API layer, database layer, authentication

**Integrations** (`.claude/integrations/`)
- Cross-system communication
- Example: external APIs, real-time features

### How It Works

**Automatic context management:**
1. Files you mention become HOT (full content injected)
2. Related files become WARM (headers only)
3. Unmentioned files decay to COLD (evicted from context)
4. State persists across sessions in `~/.claude/attn_state.json`

**Hook triggers:**
- `UserPromptSubmit`: Runs context router and pool updater
- `SessionStart`: Loads pool state from other instances
- `Stop`: Extracts and saves current work status

### Multi-Instance Coordination

If running multiple Claude Code instances:

**1. Set instance ID:**
```bash
# Add to ~/.bashrc or ~/.zshrc for persistence
export CLAUDE_INSTANCE=A  # Or B, C, D, etc.
```

**2. Signal work completion in prompts:**
```
pool
INSTANCE: A
ACTION: completed
TOPIC: User authentication refactor
SUMMARY: Migrated to NextAuth.js v5 with JWT sessions
AFFECTS: src/lib/auth.ts, src/app/api/auth/[...nextauth]/route.ts
BLOCKS: none
```

**3. Query pool status:**
```bash
python3 ~/.claude/scripts/pool-query.py --since 1h
```

### Useful Commands

```bash
# View attention state
cat ~/.claude/attn_state.json

# View pool state
cat ~/.claude/pool/instance_state.jsonl

# Query recent activity
python3 ~/.claude/scripts/pool-query.py --since 1h

# View attention history (v1.1+)
tail -20 ~/.claude/attention_history.jsonl
```

### Best Practices

1. **Organize documentation**: Use `.claude/systems/`, `.claude/modules/`, `.claude/integrations/` for detailed docs
2. **Reference files explicitly**: Mention files you're working on to keep them HOT
3. **Use pool coordination**: Signal completion status when working across multiple instances
4. **Check pool state**: Before starting work, check if another instance is already working on it
