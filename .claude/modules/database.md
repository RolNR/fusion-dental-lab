# Database Schema Documentation

**Database**: PostgreSQL (via Neon)
**ORM**: Prisma 6
**Schema File**: `prisma/schema.prisma`
**Last Updated**: 2026-01-05

## Core Entity Relationships

```
Laboratory (1)
  ├── LAB_ADMIN users (many)
  ├── LAB_COLLABORATOR users (many)
  └── Clinics (many)
      ├── CLINIC_ADMIN users (many)
      ├── DOCTOR users (many)
      ├── CLINIC_ASSISTANT users (many)
      └── Orders (many)
          ├── Files (many)
          └── Alerts (many)

DoctorAssistant (join table)
  ├── Doctor (1)
  └── Assistant (1)
```

## User Organization Links (Mutually Exclusive)

**CRITICAL**: Each user has ONE role with ONE organization link

- **LAB_ADMIN**: `user.laboratoryId` → `Laboratory.id`
- **LAB_COLLABORATOR**: `user.labCollaboratorId` → `Laboratory.id`
- **CLINIC_ADMIN**: `user.clinicId` → `Clinic.id`
- **DOCTOR**: `user.doctorClinicId` → `Clinic.id`
- **CLINIC_ASSISTANT**: `user.assistantClinicId` → `Clinic.id`

## Order Ownership

```typescript
Order.doctorId      // Who owns the order (always a DOCTOR)
Order.createdById   // Who created it (DOCTOR/ASSISTANT/ADMIN)
Order.clinicId      // Clinic isolation
```

**Examples:**
- Doctor creates own order: `doctorId === createdById`
- Assistant creates for doctor: `doctorId !== createdById`
- Clinic admin creates: `doctorId` = selected doctor, `createdById` = admin

## Order Number Format

`CLN-YYYYMMDD-001`
- CLN: Clinic prefix (first 3 letters)
- YYYYMMDD: Date
- 001: Sequential for clinic on that day

Generated in `src/lib/api/orderCreation.ts` with retry logic for race conditions.

## Common Access Patterns

```typescript
// LAB users - All orders
where: { clinic: { laboratoryId } }

// CLINIC_ADMIN - Clinic orders
where: { clinicId: session.user.clinicId }

// DOCTOR - Own orders
where: { doctorId: session.user.id }

// ASSISTANT - Assigned doctors' orders
where: {
  doctor: {
    assignedAssistants: {
      some: { assistantId: session.user.id }
    }
  }
}
```

## Key Enums

```prisma
enum Role {
  LAB_ADMIN
  LAB_COLLABORATOR
  CLINIC_ADMIN
  DOCTOR
  CLINIC_ASSISTANT
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

enum ScanType {
  DIGITAL_SCAN
  PHYSICAL_IMPRESSION
  BOTH
}
```

## Database Commands

```bash
npm run db:push       # Dev: sync schema without migration
npm run db:generate   # Generate Prisma Client
npm run db:studio     # Open Prisma Studio (localhost:5555)
npm run db:migrate    # Production: create migration
```

## Key Files

- `prisma/schema.prisma` - Schema definition
- `src/lib/prisma.ts` - Prisma client singleton
- `scripts/create-lab-admin.ts` - Initial setup
