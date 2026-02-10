# Database Schema Documentation

**Database**: PostgreSQL (via Neon)
**ORM**: Prisma 6
**Schema File**: `prisma/schema.prisma`
**Last Updated**: 2026-01-30

## Core Entity Relationships

```
Laboratory (1)
  ├── LAB_ADMIN users (many) - via laboratoryId
  └── DOCTOR users (many) - via doctorLaboratoryId
      └── Orders (many)
          ├── Teeth (many) - per-tooth configuration
          ├── Files (many)
          ├── Alerts (many)
          └── Comments (many)
```

## Two-Role System

**CRITICAL**: The system has only TWO roles

| Role | Organization Link | Purpose |
|------|------------------|---------|
| `LAB_ADMIN` | `user.laboratoryId` → `Laboratory.id` | Laboratory administrator |
| `DOCTOR` | `user.doctorLaboratoryId` → `Laboratory.id` | Dentist creating orders |

## User Organization Links

Each user has ONE role with ONE organization link:

```typescript
// LAB_ADMIN
user.laboratoryId !== null
user.doctorLaboratoryId === null

// DOCTOR
user.laboratoryId === null
user.doctorLaboratoryId !== null
```

## Doctor Extra Fields

Doctors have embedded clinic information (no separate Clinic entity):

```typescript
User {
  // ... base fields
  doctorLaboratoryId: string;    // FK to Laboratory
  clinicName: string | null;      // Doctor's clinic name
  clinicAddress: string | null;   // Clinic address
  phone: string | null;           // Contact phone
  razonSocial: string | null;     // Business name (for invoicing)
  fiscalAddress: string | null;   // Fiscal address (for invoicing)
}
```

## Order Ownership

```typescript
Order.doctorId      // Who owns the order (always a DOCTOR)
Order.createdById   // Who created it (DOCTOR or LAB_ADMIN)
```

**Examples:**
- Doctor creates own order: `doctorId === createdById`
- Lab admin creates for doctor: `doctorId` = selected doctor, `createdById` = admin's ID

## Order Number Format

`DOC-YYYYMMDD-001`
- DOC: First 3 letters of doctor name
- YYYYMMDD: Date
- 001: Sequential for that doctor on that day

Generated in `src/lib/api/orderCreation.ts` with retry logic for race conditions.

## Common Access Patterns

```typescript
// LAB_ADMIN - All orders from all doctors in their laboratory
where: {
  doctor: {
    doctorLaboratoryId: session.user.laboratoryId
  }
}

// DOCTOR - Own orders only
where: {
  doctorId: session.user.id,
  deletedAt: null  // Exclude soft-deleted
}
```

## Key Enums

```prisma
enum Role {
  LAB_ADMIN
  DOCTOR
}

enum OrderStatus {
  DRAFT
  PENDING_REVIEW
  NEEDS_INFO
  MATERIALS_SENT
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum CaseType {
  nuevo
  garantia
  regreso_prueba
  reparacion_ajuste
}

enum RestorationType {
  corona
  puente
  inlay
  onlay
  carilla
  provisional
}
```

## Per-Tooth Configuration

Orders use a per-tooth model (`Tooth` entity):

```prisma
model Tooth {
  id                   String           @id @default(cuid())
  orderId              String
  toothNumber          String           // e.g., "11", "21", "36"
  material             String?
  colorInfo            Json?            // Color configuration
  tipoRestauracion     RestorationType?
  trabajoSobreImplante Boolean?         @default(false)
  informacionImplante  Json?            // Implant details
  order                Order            @relation(...)

  @@unique([orderId, toothNumber])
}
```

## Soft Delete Pattern

Orders use soft delete for completed order cleanup:

```typescript
Order {
  deletedAt: DateTime?  // null = active, non-null = soft-deleted
}

// Filter in queries
where: { deletedAt: null }  // For doctors
// Lab admins can see deleted with ?includeDeleted=true
```

## Database Commands

```bash
npm run db:push       # Dev: sync schema without migration
npm run db:generate   # Generate Prisma Client
npm run db:studio     # Open Prisma Studio (localhost:5555)
npm run db:migrate    # Production: create migration
```

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Schema definition |
| `src/lib/prisma.ts` | Prisma client singleton |
| `scripts/create-lab-admin.ts` | Initial setup CLI |
