# Authentication & Authorization

**Framework**: NextAuth.js v4
**Strategy**: JWT sessions with bcrypt password hashing
**Session Duration**: 30 days
**Last Updated**: 2026-01-05

## Authentication Flow

```
1. User visits protected route
   ↓
2. Middleware checks session
   ↓
3. No session → Redirect to /auth/login
   ↓
4. User submits credentials
   ↓
5. NextAuth validates via Credentials provider
   ↓
6. Password verified with bcrypt.compare()
   ↓
7. JWT token created (30-day expiry)
   ↓
8. Session stored in cookie
   ↓
9. User redirected to role-specific dashboard
```

## Configuration

**File**: `src/lib/auth.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        // 1. Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { /* organization data */ },
        });

        // 2. Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        // 3. Return user data for JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          laboratoryId: user.laboratoryId,
          clinicId: user.clinicId,
          // ... other org IDs
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.laboratoryId = user.laboratoryId;
        // ... other fields
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to session
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.laboratoryId = token.laboratoryId;
      // ... other fields
      return session;
    },
  },
};
```

## Password Hashing

```typescript
import bcrypt from 'bcryptjs';

// On user creation
const hashedPassword = await bcrypt.hash(password, 10);

// On login
const isValid = await bcrypt.compare(password, user.password);
```

**Salt rounds**: 10 (bcrypt default)

## Server-Side Auth Helpers

**File**: `src/lib/auth-helpers.ts`

### Require Authentication

```typescript
import { requireAuth } from '@/lib/auth-helpers';

// In page.tsx (Server Component)
const session = await requireAuth();
// Redirects to /auth/login if not authenticated
```

### Require Specific Role(s)

```typescript
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

const session = await requireRole([Role.LAB_ADMIN, Role.LAB_COLLABORATOR]);
// Redirects to /unauthorized if wrong role
```

### Optional Auth Check

```typescript
import { getCurrentUser } from '@/lib/auth-helpers';

const user = await getCurrentUser();
// Returns user or null (no redirect)
```

## Middleware Protection

**File**: `src/middleware.ts`

Protects ALL routes except:
- `/` (home page)
- `/auth/*` (login/error pages)
- `/api/auth/*` (NextAuth endpoints)
- `/_next/*`, `/favicon.ico` (static assets)

### Route-Role Mapping

```typescript
const roleRouteMap = {
  '/lab-admin': Role.LAB_ADMIN,
  '/lab-collaborator': Role.LAB_COLLABORATOR,
  '/clinic-admin': Role.CLINIC_ADMIN,
  '/doctor': Role.DOCTOR,
  '/assistant': Role.CLINIC_ASSISTANT,
};
```

**Behavior**:
- No session → Redirect to `/auth/login`
- Wrong role for path → Redirect to `/unauthorized`
- Correct role → Allow request

## API Route Authorization

**Standard pattern**:

```typescript
export async function GET(request: NextRequest) {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Check role
  if (session.user.role !== Role.EXPECTED_ROLE) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // 3. Check organization context
  const organizationId = session.user.laboratoryId || session.user.clinicId;
  if (!organizationId) {
    return NextResponse.json({ error: 'Usuario no asociado' }, { status: 400 });
  }

  // 4. Proceed with request
}
```

## Session Data Structure

```typescript
// Type definition
interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;

  // Organization IDs (mutually exclusive)
  laboratoryId?: string | null;
  labCollaboratorId?: string | null;
  clinicId?: string | null;
  doctorClinicId?: string | null;
  assistantClinicId?: string | null;
}

// Access in components
const { data: session } = useSession();
const userRole = session?.user.role;
```

## Role-Based Dashboard Redirects

**After login** (`src/app/(auth)/auth/login/page.tsx`):

```typescript
const dashboardRoutes = {
  LAB_ADMIN: '/lab-admin',
  LAB_COLLABORATOR: '/lab-collaborator',
  CLINIC_ADMIN: '/clinic-admin',
  DOCTOR: '/doctor',
  CLINIC_ASSISTANT: '/assistant',
};

router.push(dashboardRoutes[session.user.role]);
```

## Audit Logging

**File**: `src/lib/audit.ts`

```typescript
import { logAuthEvent, getAuditContext } from '@/lib/audit';

// On successful login
await logAuthEvent('LOGIN', user.id, user.email, {
  ...getAuditContext(request),
  metadata: { name: user.name },
});

// On logout
await logAuthEvent('LOGOUT', user.id, user.email, getAuditContext(request));
```

**Captures**:
- IP address (from request headers)
- User agent
- Timestamp
- User ID and email

## Environment Variables

```bash
# NextAuth
NEXTAUTH_URL="http://localhost:3000"          # Or production URL
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Database
DATABASE_URL="postgresql://..."
```

## Security Best Practices

**Currently implemented**:
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT sessions (stateless, no DB lookups)
- ✅ 30-day session expiry
- ✅ HTTPS enforced (production)
- ✅ Role-based access control at middleware + API levels
- ✅ Audit logging for auth events
- ✅ Organization isolation (users can't access other orgs' data)

**NOT implemented** (consider for future):
- ⚠️ Password reset flow
- ⚠️ Email verification
- ⚠️ 2FA/MFA
- ⚠️ Rate limiting on login attempts
- ⚠️ Session invalidation on password change

## Common Patterns

### Protect Server Component

```typescript
// src/app/doctor/orders/page.tsx
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export default async function DoctorOrdersPage() {
  const session = await requireRole([Role.DOCTOR]);

  // User is authenticated and has DOCTOR role
  const orders = await getOrdersForDoctor(session.user.id);

  return <OrderList orders={orders} />;
}
```

### Protect Client Component

```typescript
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') return <div>Cargando...</div>;
  if (!session) return null;

  return <div>Protected content</div>;
}
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/auth-helpers.ts` | Server-side auth helpers |
| `src/middleware.ts` | Route protection |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API endpoint |
| `src/app/(auth)/auth/login/page.tsx` | Login page |
| `src/contexts/SessionProvider.tsx` | Client-side session provider |
