# Database Schema - LabWiseLink

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Order : "creates (dentist)"
    User ||--o{ Order : "processes (lab)"
    User ||--o{ Alert : "sends"
    User ||--o{ Alert : "receives"
    User ||--o{ AuditLog : "performs"
    User ||--o{ File : "uploads"

    Order ||--o{ File : "contains"
    Order ||--o{ Alert : "has"
    Order ||--o{ AuditLog : "tracks"

    File ||--o{ AuditLog : "tracks"
    Alert ||--o{ AuditLog : "tracks"

    User {
        string id PK
        string email UK
        string name
        string passwordHash
        enum role "DENTIST, LAB, ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    Order {
        string id PK
        string orderNumber UK
        string patientName
        string patientId
        string description
        string notes
        string teethNumbers "e.g., 14, 15, 16 or ranges"
        string material "Crown, Bridge, Denture, etc"
        string materialBrand
        string color "Shade specification"
        enum scanType "DIGITAL_SCAN, ANALOG_MOLD"
        enum status "DRAFT, MATERIALS_SENT, NEEDS_INFO, IN_PROGRESS, COMPLETED, CANCELLED"
        string dentistId FK
        string labId FK
        datetime createdAt
        datetime updatedAt
        datetime materialsSentAt
        datetime completedAt
    }

    File {
        string id PK
        string fileName
        string originalName
        string fileType
        string mimeType
        int fileSize
        string storageKey UK
        string storageUrl
        string orderId FK
        string uploadedById FK
        datetime createdAt
        datetime expiresAt
        datetime deletedAt
    }

    Alert {
        string id PK
        string message
        enum status "UNREAD, READ, RESOLVED"
        string orderId FK
        string senderId FK
        string receiverId FK
        datetime createdAt
        datetime readAt
        datetime resolvedAt
    }

    AuditLog {
        string id PK
        enum action "CREATE, UPDATE, DELETE, LOGIN, LOGOUT, REGISTER, FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE, STATUS_CHANGE, ALERT_SENT, ALERT_READ"
        string entityType
        string entityId
        text oldValue
        text newValue
        json metadata
        string userId FK
        string ipAddress
        string userAgent
        string orderId FK
        string fileId FK
        string alertId FK
        datetime createdAt
    }
```

## Key Features

### 1. **User Management**
- Three roles: `DENTIST`, `LAB`, `ADMIN`
- Secure password hashing
- Email-based authentication

### 2. **Order Tracking**
- Unique order numbers
- Status workflow: `DRAFT` → `MATERIALS_SENT` → `IN_PROGRESS` → `COMPLETED`
- Special status: `NEEDS_INFO` (when lab needs clarification)
- Patient information stored with each order
- Timestamps for key transitions

### 3. **File Management**
- Support for STL files and images
- Metadata: original name, size, mime type
- R2 storage integration (storageKey, storageUrl)
- Auto-expiration (files older than 1 month)
- Soft delete support (deletedAt)

### 4. **Alert System**
- Lab can send alerts to dentist
- Dentist can send alerts to lab
- Alert statuses: `UNREAD` → `READ` → `RESOLVED`
- Linked to specific orders

### 5. **Audit Logging**
- Complete audit trail for compliance
- Tracks all actions: logins, file operations, status changes
- Stores old/new values for changes
- IP address and user agent tracking
- Flexible metadata field (JSON) for additional context
- Links to related entities (orders, files, alerts)

## Indexes for Performance

- **User**: `email`, `role`
- **Order**: `dentistId`, `labId`, `status`, `createdAt`, `orderNumber`
- **File**: `orderId`, `uploadedById`, `createdAt`, `expiresAt`, `storageKey`
- **Alert**: `orderId`, `senderId`, `receiverId`, `status`, `createdAt`
- **AuditLog**: `userId`, `action`, `entityType + entityId`, `createdAt`, `orderId`

## Data Retention

- Files: Auto-expire after 1 month (per sequence diagram)
- Audit logs: Retained indefinitely for compliance
- Soft deletes: Files marked with `deletedAt` instead of hard deletion
