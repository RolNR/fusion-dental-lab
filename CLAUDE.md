# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LabWiseLink** - Dental lab order management platform connecting ONE laboratory with the doctors (dentists) who send it work.

- **Tech Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Prisma 6, PostgreSQL (Neon), NextAuth.js v4, Tailwind CSS 4, Cloudflare R2
- **Other services**: Anthropic Claude (AI order parsing/validation, via `@posthog/ai` wrapper), PostHog (product + LLM analytics, error tracking), SendPulse (email), Three.js (3D STL preview), Sharp (image thumbnails)
- **Deploy**: Vercel (`vercel.json` defines a daily cron)
- **Language**: All user-facing content MUST be in Spanish
- **Authentication**: Credentials provider, JWT sessions (30-day expiry), role-based access control
- **Business Model**: Single laboratory; doctors are its clients. There is no Clinic entity — a doctor's clinic info lives as plain fields on `User` (`clinicName`, `clinicAddress`, `razonSocial`, `fiscalAddress`)

## Development Commands

```bash
# Development
npm run dev                    # Dev server with Turbopack (hostname 0.0.0.0)
npm run build                  # prisma generate + next build (MUST pass before commits)
npm run start                  # Production server

# Database
npm run db:generate            # Generate Prisma Client (also runs on postinstall)
npm run db:push                # Push schema to database (dev only)
npm run db:migrate             # prisma migrate dev
npm run db:studio              # Prisma Studio on localhost:5555

# Code Quality
npm run lint                   # ESLint
npm run format                 # Prettier (includes Tailwind class sorting)

# Initial Setup
npm run create-lab-admin       # Interactive CLI to create Laboratory + LAB_ADMIN user
```

Husky is installed (`prepare` script) for git hooks. Other scripts in `scripts/`: `export-data.ts`, `fix-relation-names.sh`.

## Architecture

### Roles

Only two roles exist (`enum Role` in `prisma/schema.prisma`):

**1. LAB_ADMIN** - Laboratory administrator
- Views and manages ALL orders from doctors of their laboratory
- Changes order status (see state machine), sends alerts to doctors
- Manages users (creates doctors), laboratory settings, analytics
- Database: `user.laboratoryId → Laboratory.id` (relation `LaboratoryAdmins`)

**2. DOCTOR** - Dentist
- Creates, edits, submits and views ONLY their own orders
- Uploads files, answers lab info requests, receives alerts
- Can self-register at `/auth/register` (`POST /api/auth/register` links them to the single `Laboratory` via `findFirst()`)
- Database: `user.doctorLaboratoryId → Laboratory.id` (relation `LaboratoryDoctors`)

In the session, both are normalized to `session.user.laboratoryId` (set in `authorize()` in `src/lib/auth.ts`).

### Data Model (`prisma/schema.prisma`)

- `Laboratory` → `labAdmins`, `doctors`
- `User` (role, org links, doctor clinic/fiscal fields)
- `Order` → `doctor` (owner), `createdBy`, `teeth`, `files`, `comments`, `alerts`, `auditLogs`. Soft delete via `deletedAt`. Many fields in Spanish (`tipoCaso`, `fechaEntregaDeseada`, `escanerUtilizado`, `submissionType`, `oclusionDiseno`, `materialSent`, `isUrgent`, `aiPrompt`, `initialToothStates`)
- `Tooth` - per-tooth configuration (`toothNumber`, `material`, `colorInfo`, `categoriaRestauracion`, `tipoRestauracion`, implant info, provisional, jig). `@@unique([orderId, toothNumber])`
- `File` - R2 metadata (`storageKey`, `storageUrl`, `category`, `thumbnailUrl`, `isProcessed`, `expiresAt`, `deletedAt`)
- `OrderComment` - with `isInternal` flag for lab-only comments
- `Alert` - lab → doctor messages (`UNREAD | READ | RESOLVED`)
- `AuditLog`

Domain enums are lowercase Spanish (`CaseType`, `RestorationType`, `RestorationCategory`, `SubmissionType`, `ArticulatedBy`, `ProvisionalMaterial`); `ScannerType` lists iTero, Medit, ThreeShape, etc.

`order.doctorId` and `order.createdById` are both the doctor's id in the current flow.

## Order State Machine

File: `src/lib/orderStateMachine.ts`

```
DRAFT → PENDING_REVIEW → IN_PROGRESS → COMPLETED
            ↓    ↑
         NEEDS_INFO
(MATERIALS_SENT → IN_PROGRESS | NEEDS_INFO)
Any non-terminal → CANCELLED (subject to role rules)
```

**DOCTOR:** `DRAFT → PENDING_REVIEW | CANCELLED`, `NEEDS_INFO → PENDING_REVIEW`

**LAB_ADMIN:** `PENDING_REVIEW | MATERIALS_SENT → IN_PROGRESS | NEEDS_INFO | CANCELLED`, `IN_PROGRESS → COMPLETED | CANCELLED`, `NEEDS_INFO → CANCELLED`

```typescript
import { canUserTransition, getValidNextStatesForRole, getTimestampUpdates } from '@/lib/orderStateMachine';

if (!canUserTransition(userRole, currentStatus, newStatus)) {
  return NextResponse.json({ error: 'Transición no permitida' }, { status: 403 });
}
```

Status changes go through `updateOrderStatus()` in `src/lib/api/orderStatusUpdate.ts`, which also sets timestamps, writes audit logs, emits SSE events, and sends email notifications (`src/lib/order-notifications.ts`). Edit/delete permissions per status: `src/lib/api/orderEditValidation.ts`.

## Routes

### Pages

```
src/app/
├── page.tsx                         # Public home
├── auth/{login,register,error,signout}
├── unauthorized/
├── doctor/
│   ├── page.tsx                     # Dashboard (includes AI prompt to start an order)
│   ├── orders/ (list, new, [orderId], [orderId]/edit)
│   └── settings/
└── lab-admin/
    ├── page.tsx                     # Dashboard
    ├── orders/ (list, [orderId])
    ├── users/ (list, new, [userId], [userId]/edit)
    ├── laboratory/
    ├── analytics/
    └── settings/
```

### API

```
/api/auth/[...nextauth]                     NextAuth
/api/auth/register                          Doctor self-registration
/api/doctor/orders[/orderId[/submit]]       Doctor order CRUD + submit
/api/doctor/alerts[/alertId]                Doctor alerts
/api/lab-admin/orders[/orderId]             Lab order list/detail/status
/api/lab-admin/users[/userId]               User management (creates DOCTOR)
/api/lab-admin/laboratory                   Lab settings
/api/lab-admin/analytics                    Analytics (src/lib/analytics.ts)
/api/orders/[orderId]/comments              Shared comments
/api/orders/[orderId]/files[/fileId]        File list/delete
/api/orders/[orderId]/files/upload-url      Presigned R2 PUT URL
/api/orders/[orderId]/files/process-upload  Save metadata + generate thumbnail
/api/orders/parse-ai-prompt                 Claude: free text → order fields
/api/orders/validate-order                  Claude: pre-submit validation
/api/alerts/events                          SSE: new alerts (doctor)
/api/lab/order-events                       SSE: new orders (lab)
/api/user/profile                           Profile update
/api/cron/cleanup-orders                    Daily cleanup (secured by CRON_SECRET)
```

### Middleware

`src/middleware.ts` (NextAuth `withAuth`):
- Unauthenticated → `/auth/login`
- `/lab-admin/*` requires LAB_ADMIN, `/doctor/*` requires DOCTOR, otherwise → `/unauthorized`
- Excluded from matcher: `/`, `/auth`, `/api/auth`, `/api/cron`, `/ingest` (PostHog reverse proxy, see `next.config.ts` rewrites), static assets

## API Route Patterns

### Standard Pattern

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (session.user.role !== Role.LAB_ADMIN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // ... query using session.user.laboratoryId / session.user.id
}
```

Unexpected errors in routes should be reported with `captureApiError()` from `src/lib/posthog-server.ts`.

### Order Access Control

```typescript
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

// LAB_ADMIN: order.doctor.doctorLaboratoryId must match laboratoryId
// DOCTOR: order.doctorId must match userId
const result = await checkOrderAccess({
  orderId,
  userId: session.user.id,
  userRole: session.user.role,
  laboratoryId: session.user.laboratoryId,
});

if (!result.hasAccess) {
  return NextResponse.json({ error: result.error }, { status: result.statusCode });
}
const order = result.order;
```

### Order Creation with Retry

```typescript
import { createOrderWithRetry } from '@/lib/api/orderCreation';

// Retries on orderNumber unique collisions (P2002)
const order = await createOrderWithRetry({
  orderData: { ...validatedData, doctor: { connect: { id } }, createdBy: { connect: { id } } },
  doctorId,
  patientName: validatedData.patientName,
});
```

Other helpers in `src/lib/api/`: `orderQueries.ts` (`orderDetailInclude`), `orderFilters.ts` (`buildOrderWhereClause`), `orderUpdate.ts` (`updateOrderWithTeeth`), `submitOrderHandler.ts` (`createSubmitOrderHandler`), `paths.ts`, `alertActions.ts`, `orderFormHelpers.ts` (client-side fetch helpers).

### Zod Validation

```typescript
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

// IMPORTANT: Use z.nativeEnum() for Prisma enums, NOT z.enum([...])
const schema = z.object({
  patientName: z.string().min(1, 'Nombre requerido'),
  status: z.nativeEnum(OrderStatus),
});

// On error
if (error instanceof z.ZodError) {
  return NextResponse.json({
    error: 'Validación fallida',
    details: error.issues.map((err) => ({ field: err.path.join('.'), message: err.message })),
  }, { status: 400 });
}
```

Shared schemas: `src/lib/schemas/userSchemas.ts`, `src/lib/validations/auth.ts`.

## Authentication Helpers

```typescript
import { requireAuth, requireRole, getCurrentUser, hasRole, isAuthenticated } from '@/lib/auth-helpers';

const session = await requireAuth();                 // redirects to /auth/login
const session = await requireRole([Role.LAB_ADMIN]); // redirects to /unauthorized
const user = await getCurrentUser();                 // null if not authenticated
```

Session type augmentation: `src/types/next-auth.d.ts`. On `update()` trigger the JWT refreshes `name`/`email` from DB.

## Order Form & AI

- Main form: `src/components/clinic-staff/OrderForm.tsx` with sections in `clinic-staff/order-form/` (odontogram, per-tooth configuration, implants, occlusion, materials sent, scans, photos, etc.)
- `OrderTicket.tsx` - live order summary sidebar (replaced the old review modal); `components/orders/review-sections/` renders order summary blocks
- `DashboardAIPrompt.tsx` / `AIPromptInput.tsx` - doctor describes the case in natural language (text or voice) → `/api/orders/parse-ai-prompt` → fields prefilled
- `/api/orders/validate-order` - AI pre-submit validation, gated by `NEXT_PUBLIC_ENABLE_ORDER_AI_VALIDATION` (enabled unless `'false'`)
- Both AI routes use `Anthropic` from `@posthog/ai` (LLM analytics) with the `AI_MODEL` constant defined per route
- Domain lookups: `materialsByRestoration.ts`, `shadeSystemLookup.ts`, `materialWarrantyUtils.ts`, `scannerDetection.ts`, `orderSummaryGenerator.ts`
- Draft limit per doctor: `MAX_DRAFTS_PER_DOCTOR` (default 5) in `src/lib/constants.ts`

## File Storage (Cloudflare R2)

Upload flow (direct browser → R2):
1. Client requests presigned PUT URL: `POST /api/orders/[orderId]/files/upload-url` (`generateUploadUrl` in `src/lib/r2.ts`, 5-min expiry)
2. Client uploads file directly to R2
3. Client calls `POST /api/orders/[orderId]/files/process-upload` → stores `File` metadata; images get a thumbnail via Sharp (`src/lib/imageProcessing.ts`)

Other R2 helpers: `generateDownloadUrl`, `deleteFile`, `getPublicUrl`, `uploadBuffer`, `batchDeleteFiles` (`r2-batch.ts`).

## Background Jobs

`/api/cron/cleanup-orders` runs daily at 03:00 (`vercel.json`), secured by `CRON_SECRET`. Logic in `src/lib/services/orderCleanup.ts`: deletes completed orders older than `COMPLETED_ORDER_RETENTION_DAYS` (default 10) and their R2 files/thumbnails. Supports dry-run.

## Real-Time Features

In-process event bus `src/lib/sse/eventBus.ts`:
- `new-alert` → `/api/alerts/events` (doctors; hooks `useAlerts`, `useAlertActions`)
- `new-order` → `/api/lab/order-events` (lab admin; hook `useLabOrderEvents`, component `LabOrderNotifications`)

Events are emitted from `orderStatusUpdate.ts`. Note: the bus is in-memory, so events only reach clients connected to the same server instance.

### Toasts

```typescript
import { useToast } from '@/contexts/ToastContext';
const { showToast } = useToast();
showToast('Orden creada exitosamente', 'success'); // success | error | info | warning
```

## Audit Logging

```typescript
import { logAuthEvent, logOrderEvent, logFileEvent, logAlertEvent, getAuditContext } from '@/lib/audit';

await logOrderEvent('STATUS_CHANGE', userId, orderId,
  { status: oldStatus },
  { status: newStatus },
  getAuditContext(request) // { ipAddress, userAgent }
);
```

LOGIN/LOGOUT are logged automatically from NextAuth `events`.

## Analytics (PostHog)

- Client: `instrumentation-client.ts` (`posthog-js`, `api_host: '/ingest'`, exception capture on)
- Server: `src/lib/posthog-server.ts` (`getPostHogClient`, `captureApiError`)
- LLM calls traced via `@posthog/ai`

## Environment Variables

See `.env.example`: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `R2_*`, `ANTHROPIC_API_KEY`, `SENDPULSE_*`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_ENABLE_ORDER_AI_VALIDATION`, `MAX_DRAFTS_PER_DOCTOR`, `COMPLETED_ORDER_RETENTION_DAYS`, `CRON_SECRET`.

## UI Component System

### CRITICAL RULES

1. **ALWAYS use custom UI components** - Never inline `<input>`, `<select>`, `<button>`, `<textarea>`
2. **ALL icons in `src/components/ui/Icons.tsx`** - Never inline `<svg>` elements
3. **ALWAYS use semantic colors** - Never hardcoded colors like `bg-blue-600`, `text-gray-900`

### Components (`src/components/ui/`)

`Input`, `PasswordInput`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Range`, `Button` (variants: primary | secondary | danger | ghost; sizes: sm | md | lg; `isLoading`), `Modal`, `Table`, `Pagination`, `PageHeader`, `FileUpload`, `Toast`, `GuidedTooltip`, charts (`PieChart`, `HorizontalBarChart`), and form layout helpers in `ui/form/` (`SectionContainer`, `SectionHeader`, `FieldLabel`, `ButtonCard`, `ToggleButtonGroup`, `CollapsibleSubsection`).

```tsx
<Input
  label="Correo electrónico"
  required
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  error={errors.email}
/>

<Button type="submit" variant="primary" isLoading={isLoading}>Guardar</Button>

<Icons.alertCircle className="h-6 w-6 text-warning" />
```

Icons include general UI (spinner, check, x, alertCircle, eye, upload, trash, mic…) and dental ones (tooth, crown, bridge, inlay, veneer, implant, abutment, denture, surgicalGuide, guard…). Add new icons to `Icons.tsx`.

### Component Organization

```
src/components/
├── ui/              # Shared primitives (ALWAYS use these)
├── auth/            # Login/Register forms
├── clinic-staff/    # Doctor-side: nav, order form, dashboard AI prompt
├── lab-admin/       # Lab admin nav, orders table, user & lab forms
├── lab-shared/      # Lab order detail page, order notifications
├── orders/          # Shared order detail/edit, files, comments, status control
├── settings/        # Profile settings
└── providers/       # SessionProvider
```

Hooks in `src/hooks/` (`useApi`, `useOrderDetail`, `useSubmitOrder`, `useAlerts`, `useLabOrderEvents`, `useProfileUpdate`, `useGuidedTooltips`); shared types in `src/types/`.

## Design System - Semantic Colors

```tsx
// ❌ WRONG
<button className="bg-blue-600 text-white hover:bg-blue-700">

// ✅ CORRECT
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
```

- **Primary**: `bg-primary`, `text-primary`, `border-primary`, `bg-primary-hover`, `text-primary-foreground`
- **Danger**: `bg-danger`, `text-danger`, `bg-danger-hover`, `text-danger-foreground`, `bg-danger/10`
- **Success / Warning**: `bg-success`, `text-success`, `bg-success/10`, `bg-warning`, `text-warning`, `bg-warning/10`
- **Neutral**: `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `border-border-input`

See `docs/design-system.md`.

## Spanish Language Requirement

**ALL user-facing content MUST be in Spanish** (labels, errors, API error messages, toasts, emails).

Common: Iniciar sesión, Correo electrónico, Contraseña, Enviar, Cancelar, Guardar, Eliminar, Editar, Crear, Cargando…

## Code Quality Checklist

1. ✅ Custom UI components (no raw form elements)
2. ✅ Icons only from Icons.tsx
3. ✅ Semantic colors only
4. ✅ Spanish user-facing text
5. ✅ Zod with `z.nativeEnum()` for Prisma enums
6. ✅ Proper status codes: 200/201/400/401/403/404/500
7. ✅ TypeScript strict (no `any`, `unknown` in catch)
8. ✅ Audit logging for important actions
9. ✅ **`npm run build` MUST PASS**

## Pendientes

Known issues to review (not yet resolved):

- [ ] **`docs/new-business-model.md` is stale** - describes the clinics/assistants/collaborators design that was never implemented. Update it or archive it.
- [ ] **SSE event bus is in-memory** (`src/lib/sse/eventBus.ts`) - on Vercel, events only reach clients connected to the same function instance. Consider a shared pub/sub (e.g. Redis) or polling fallback.
- [ ] **LAB_ADMIN cannot move `NEEDS_INFO` back to review** - `ROLE_TRANSITIONS` only allows `NEEDS_INFO → CANCELLED` for the lab. Confirm this is intended.

## Documentation

- `README.md` - Setup and overview
- `docs/deployment-guide.md` - Deployment (Vercel + Neon + R2)
- `docs/design-system.md` - Design system
- `docs/feature-flags.md` - Feature flag conventions
- `docs/new-business-model.md` - Earlier multi-tenant design (clinics/assistants) — **not implemented**; current model is lab + doctors only
- `database-schema.md` - Schema notes
- `CODE_REVIEW_CHECKLIST.md` - Code quality checklist
- `.claude/instructions.md` and `.claude/{systems,modules,integrations}/` - Additional context docs
