# Nuevo Modelo de Negocio - LabWiseLink

## Cambio de Estrategia

**Antes:** Plataforma de marketplace conectando múltiples dentistas con múltiples laboratorios.

**Ahora:** Plataforma vendida a UN laboratorio dental que administra múltiples clínicas como clientes.

---

## Estructura de Usuarios

### Lado del Laboratorio

#### 1. LAB_ADMIN (Admin del Laboratorio)
**Responsabilidades:**
- Crear y gestionar cuentas de clínicas dentales
- Dar de alta y gestionar colaboradores del laboratorio
- Ver TODAS las órdenes de TODAS las clínicas
- Administrar configuración del laboratorio
- Ver reportes y métricas globales

**Permisos:**
- Acceso completo al sistema
- CRUD de clínicas
- CRUD de usuarios del laboratorio
- Ver/editar todas las órdenes (futuro)
- Acceso a reportes y analytics

#### 2. LAB_COLLABORATOR (Colaborador del Laboratorio)
**Responsabilidades:**
- Ver órdenes de todas las clínicas
- Actualizar estado de órdenes (futuro)
- Comunicarse con clínicas sobre órdenes

**Permisos:**
- Ver todas las órdenes (solo lectura por ahora)
- Ver información de clínicas
- Enviar/recibir alertas sobre órdenes

### Lado de la Clínica Dental

#### 3. CLINIC_ADMIN (Admin de Clínica)
**Responsabilidades:**
- Gestionar doctores de su clínica
- Gestionar asistentes de su clínica
- Asignar asistentes a doctores
- Ver TODAS las órdenes de SU clínica
- Crear órdenes

**Permisos:**
- CRUD de doctores de su clínica
- CRUD de asistentes de su clínica
- Ver/crear órdenes de su clínica
- Ver reportes de su clínica

#### 4. DOCTOR
**Responsabilidades:**
- Crear órdenes para sus pacientes
- Ver solo SUS órdenes
- Actualizar estado de sus órdenes
- Comunicarse con el laboratorio

**Permisos:**
- Crear órdenes (asignadas a él)
- Ver solo órdenes donde doctorId = su ID
- Editar sus propias órdenes
- Subir archivos a sus órdenes
- Enviar/recibir alertas sobre sus órdenes

#### 5. CLINIC_ASSISTANT (Asistente de Clínica)
**Responsabilidades:**
- Asistir a uno o múltiples doctores
- Crear órdenes EN NOMBRE de los doctores que asiste
- Ver órdenes de los doctores que asiste
- Gestionar archivos y comunicación

**Permisos:**
- Crear órdenes (debe especificar para qué doctor)
- Ver órdenes donde doctorId IN (doctores que asiste)
- Editar órdenes de doctores que asiste
- Subir archivos
- Enviar/recibir alertas

---

## Nuevo Modelo de Datos

### Entidades Principales

#### Laboratory (Laboratorio)
```prisma
model Laboratory {
  id          String   @id @default(cuid())
  name        String   // "Laboratorio Dental XYZ"
  email       String   @unique
  phone       String?
  address     String?

  // Relaciones
  users       User[]     // Lab admins y colaboradores
  clinics     Clinic[]   // Clínicas clientes
  orders      Order[]    // Todas las órdenes

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([email])
}
```

#### Clinic (Clínica Dental)
```prisma
model Clinic {
  id          String   @id @default(cuid())
  name        String   // "Clínica Dental San Juan"
  email       String?
  phone       String?
  address     String?

  // Relación con laboratorio
  labId       String
  lab         Laboratory @relation(fields: [labId], references: [id], onDelete: Cascade)

  // Relaciones
  users       User[]     // Clinic admin, doctores, asistentes
  orders      Order[]    // Órdenes de esta clínica

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([labId])
  @@index([name])
}
```

#### User (Usuario)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          Role

  // Relación organizacional (exclusiva: solo una de estas dos)
  clinicId      String?
  clinic        Clinic?   @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  labId         String?
  lab           Laboratory? @relation(fields: [labId], references: [id], onDelete: Cascade)

  // Para asistentes: relación con doctores
  assistedDoctors DoctorAssistant[] @relation("Assistant")
  assistants      DoctorAssistant[] @relation("Doctor")

  // Órdenes
  ordersCreated   Order[]   @relation("CreatedBy")   // Órdenes que creó
  ordersAssigned  Order[]   @relation("AssignedDoctor") // Órdenes asignadas a él (si es doctor)

  // Otras relaciones
  alertsSent      Alert[]   @relation("AlertSender")
  alertsReceived  Alert[]   @relation("AlertReceiver")
  filesUploaded   File[]
  auditLogs       AuditLog[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([role])
  @@index([clinicId])
  @@index([labId])
}
```

#### DoctorAssistant (Relación Doctor-Asistente)
```prisma
model DoctorAssistant {
  id          String   @id @default(cuid())

  doctorId    String
  doctor      User     @relation("Doctor", fields: [doctorId], references: [id], onDelete: Cascade)

  assistantId String
  assistant   User     @relation("Assistant", fields: [assistantId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([doctorId, assistantId])
  @@index([doctorId])
  @@index([assistantId])
}
```

#### Order (Orden)
```prisma
model Order {
  id              String       @id @default(cuid())
  orderNumber     String       @unique @default(cuid())

  // Información del paciente
  patientName     String
  patientId       String?

  // Detalles de la orden
  description     String?
  notes           String?
  teethNumbers    String?
  material        String?
  materialBrand   String?
  color           String?
  scanType        ScanType?
  status          OrderStatus  @default(DRAFT)

  // Relaciones organizacionales
  clinicId        String
  clinic          Clinic       @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  labId           String
  lab             Laboratory   @relation(fields: [labId], references: [id], onDelete: Cascade)

  // Usuarios
  createdById     String
  createdBy       User         @relation("CreatedBy", fields: [createdById], references: [id])

  doctorId        String
  doctor          User         @relation("AssignedDoctor", fields: [doctorId], references: [id])

  // Timestamps
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  materialsSentAt DateTime?
  completedAt     DateTime?

  // Relaciones
  files           File[]
  alerts          Alert[]
  auditLogs       AuditLog[]

  @@index([clinicId])
  @@index([labId])
  @@index([doctorId])
  @@index([createdById])
  @@index([status])
  @@index([createdAt])
  @@index([orderNumber])
}
```

### Nuevos Roles (Enum)
```prisma
enum Role {
  LAB_ADMIN        // Admin del laboratorio (super admin)
  LAB_COLLABORATOR // Colaborador del laboratorio (solo ver órdenes)
  CLINIC_ADMIN     // Admin de clínica (gestiona su clínica)
  DOCTOR           // Doctor (crea y ve sus órdenes)
  CLINIC_ASSISTANT // Asistente (crea órdenes para doctores)
}
```

---

## Flujos de Trabajo

### 1. Onboarding Inicial

```
1. LAB_ADMIN se registra (primer usuario)
   - Crea su Laboratory automáticamente
   - Se asigna como LAB_ADMIN del lab

2. LAB_ADMIN crea clínicas:
   POST /api/lab/clinics
   {
     "name": "Clínica Dental San Juan",
     "email": "contacto@clinicasj.com",
     "phone": "555-1234",
     "address": "Calle Principal 123"
   }

3. LAB_ADMIN crea CLINIC_ADMIN para cada clínica:
   POST /api/lab/clinics/{clinicId}/users
   {
     "email": "admin@clinicasj.com",
     "name": "Dr. Juan Pérez",
     "password": "temporal123",
     "role": "CLINIC_ADMIN"
   }
```

### 2. CLINIC_ADMIN Configura su Clínica

```
1. CLINIC_ADMIN da de alta doctores:
   POST /api/clinic/doctors
   {
     "email": "dr.martinez@clinicasj.com",
     "name": "Dra. María Martínez",
     "password": "temporal123"
   }

2. CLINIC_ADMIN da de alta asistentes:
   POST /api/clinic/assistants
   {
     "email": "asistente1@clinicasj.com",
     "name": "Ana López",
     "password": "temporal123"
   }

3. CLINIC_ADMIN asigna asistentes a doctores:
   POST /api/clinic/doctor-assistants
   {
     "doctorId": "cuid_doctor",
     "assistantId": "cuid_asistente"
   }
```

### 3. Crear Orden

#### Doctor crea orden:
```
POST /api/orders
{
  "patientName": "Paciente Ejemplo",
  "patientId": "PAC-001",
  "description": "Corona dental",
  "teethNumbers": "14, 15",
  "material": "Zirconia",
  "doctorId": "self" // Se asigna automáticamente
}

Backend:
- doctorId = session.user.id
- createdById = session.user.id
- clinicId = session.user.clinicId
- labId = clinic.labId
```

#### Asistente crea orden:
```
POST /api/orders
{
  "patientName": "Paciente Ejemplo",
  "patientId": "PAC-001",
  "description": "Corona dental",
  "teethNumbers": "14, 15",
  "material": "Zirconia",
  "doctorId": "cuid_del_doctor" // DEBE especificar
}

Validación backend:
- Verificar que assistantId tiene relación con doctorId en DoctorAssistant
- Si no, rechazar con 403
```

#### Clinic Admin crea orden:
```
POST /api/orders
{
  "patientName": "Paciente Ejemplo",
  "patientId": "PAC-001",
  "description": "Corona dental",
  "teethNumbers": "14, 15",
  "material": "Zirconia",
  "doctorId": "cuid_del_doctor" // Puede especificar cualquier doctor de su clínica
}
```

### 4. Ver Órdenes (Permisos)

```sql
-- LAB_ADMIN / LAB_COLLABORATOR
SELECT * FROM Order WHERE labId = user.labId

-- CLINIC_ADMIN
SELECT * FROM Order WHERE clinicId = user.clinicId

-- DOCTOR
SELECT * FROM Order WHERE doctorId = user.id

-- CLINIC_ASSISTANT
SELECT * FROM Order
WHERE doctorId IN (
  SELECT doctorId FROM DoctorAssistant
  WHERE assistantId = user.id
)
```

---

## Rutas API (Nuevas)

### Laboratory Management (LAB_ADMIN only)

```
POST   /api/lab/clinics              # Crear clínica
GET    /api/lab/clinics              # Listar clínicas
GET    /api/lab/clinics/{id}         # Ver clínica
PUT    /api/lab/clinics/{id}         # Editar clínica
DELETE /api/lab/clinics/{id}         # Eliminar clínica

POST   /api/lab/collaborators        # Crear colaborador del lab
GET    /api/lab/collaborators        # Listar colaboradores
DELETE /api/lab/collaborators/{id}   # Eliminar colaborador

GET    /api/lab/orders               # Ver todas las órdenes
GET    /api/lab/stats                # Estadísticas globales
```

### Clinic Management (CLINIC_ADMIN only)

```
POST   /api/clinic/doctors           # Crear doctor
GET    /api/clinic/doctors           # Listar doctores
PUT    /api/clinic/doctors/{id}      # Editar doctor
DELETE /api/clinic/doctors/{id}      # Eliminar doctor

POST   /api/clinic/assistants        # Crear asistente
GET    /api/clinic/assistants        # Listar asistentes
PUT    /api/clinic/assistants/{id}   # Editar asistente
DELETE /api/clinic/assistants/{id}   # Eliminar asistente

POST   /api/clinic/doctor-assistants # Asignar asistente a doctor
DELETE /api/clinic/doctor-assistants/{id} # Desasignar

GET    /api/clinic/orders            # Ver órdenes de la clínica
GET    /api/clinic/stats             # Estadísticas de la clínica
```

### Orders (DOCTOR, CLINIC_ASSISTANT, CLINIC_ADMIN)

```
POST   /api/orders                   # Crear orden
GET    /api/orders                   # Listar MIS órdenes (filtrado por rol)
GET    /api/orders/{id}              # Ver orden (si tiene permiso)
PUT    /api/orders/{id}              # Editar orden (si tiene permiso)
DELETE /api/orders/{id}              # Eliminar orden (si tiene permiso)

POST   /api/orders/{id}/files        # Subir archivo
GET    /api/orders/{id}/files        # Listar archivos
DELETE /api/orders/{id}/files/{fileId} # Eliminar archivo

POST   /api/orders/{id}/alerts       # Enviar alerta
GET    /api/orders/{id}/alerts       # Ver alertas
```

---

## Middleware de Autorización

```typescript
// Ejemplo de middleware para verificar permisos
export function requireLabAdmin(handler) {
  return async (req, res) => {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'LAB_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return handler(req, res);
  };
}

export function requireClinicAdmin(handler) {
  return async (req, res) => {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return handler(req, res);
  };
}

export async function canAccessOrder(userId: string, orderId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assistedDoctors: true,
      clinic: true,
      lab: true,
    },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!user || !order) return false;

  switch (user.role) {
    case 'LAB_ADMIN':
    case 'LAB_COLLABORATOR':
      return order.labId === user.labId;

    case 'CLINIC_ADMIN':
      return order.clinicId === user.clinicId;

    case 'DOCTOR':
      return order.doctorId === user.id;

    case 'CLINIC_ASSISTANT':
      const assistedDoctorIds = user.assistedDoctors.map(ad => ad.doctorId);
      return assistedDoctorIds.includes(order.doctorId);

    default:
      return false;
  }
}
```

---

## Validaciones de Negocio

### 1. Usuario solo puede pertenecer a Lab O Clinic (no ambos)
```typescript
if (user.labId && user.clinicId) {
  throw new Error('Usuario no puede pertenecer a lab y clínica simultáneamente');
}
```

### 2. Roles deben coincidir con organización
```typescript
// LAB_ADMIN y LAB_COLLABORATOR deben tener labId
if (['LAB_ADMIN', 'LAB_COLLABORATOR'].includes(user.role) && !user.labId) {
  throw new Error('Usuario de laboratorio debe tener labId');
}

// CLINIC_ADMIN, DOCTOR, CLINIC_ASSISTANT deben tener clinicId
if (['CLINIC_ADMIN', 'DOCTOR', 'CLINIC_ASSISTANT'].includes(user.role) && !user.clinicId) {
  throw new Error('Usuario de clínica debe tener clinicId');
}
```

### 3. Asistente solo puede crear órdenes para doctores que asiste
```typescript
if (user.role === 'CLINIC_ASSISTANT') {
  const assists = await prisma.doctorAssistant.findFirst({
    where: {
      assistantId: user.id,
      doctorId: orderData.doctorId,
    },
  });

  if (!assists) {
    throw new Error('Asistente no puede crear órdenes para este doctor');
  }
}
```

### 4. Orden debe pertenecer a la misma clínica que el usuario
```typescript
const doctor = await prisma.user.findUnique({
  where: { id: orderData.doctorId },
});

if (doctor.clinicId !== user.clinicId) {
  throw new Error('Doctor no pertenece a tu clínica');
}
```

---

## Próximos Pasos

1. ✅ Revisar y aprobar este diseño
2. ⏳ Actualizar schema.prisma con nuevos modelos
3. ⏳ Crear migración y resetear base de datos
4. ⏳ Actualizar tipos TypeScript
5. ⏳ Crear APIs para LAB_ADMIN (gestión de clínicas)
6. ⏳ Crear APIs para CLINIC_ADMIN (gestión de usuarios)
7. ⏳ Actualizar API de órdenes con nuevos permisos
8. ⏳ Actualizar UI para los diferentes roles
9. ⏳ Crear script de seed con datos de ejemplo

---

## Preguntas Pendientes

1. ¿El LAB_ADMIN inicial se registra normalmente o necesita un proceso especial?
2. ¿Queremos soft-delete para clínicas/usuarios o hard-delete?
3. ¿Las clínicas pueden tener configuración personalizada (logo, colores, etc.)?
4. ¿Necesitamos facturación/pricing diferenciado por clínica?
5. ¿El LAB_COLLABORATOR eventualmente podrá editar órdenes o siempre solo lectura?
