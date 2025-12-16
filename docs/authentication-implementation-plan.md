# LabWiseLink Authentication Implementation Plan

## Overview
Implement NextAuth.js v4 authentication for LabWiseLink with JWT sessions, admin-approved registration, and comprehensive audit logging.

## User Requirements
- ✅ **Skip password reset** - No email-based password reset for MVP
- ✅ **Skip rate limiting** - Add security hardening later
- ✅ **Admin-approved registration** - Users register but must be approved before login
- ✅ **Full audit trail** - Log all authentication events for compliance

## Architecture Decisions

### Session Strategy: JWT (Stateless)
**Rationale:**
- No database queries on every request (faster)
- Better scalability for production
- Encrypted httpOnly cookies with CSRF protection
- No session table needed in database

### Database Changes Required

**Add to Prisma schema:**

1. **User model update** - Add approval status field:
```prisma
model User {
  // ... existing fields
  isApproved    Boolean   @default(false)
  approvedAt    DateTime?
  approvedById  String?
  approvedBy    User?     @relation("UserApprovals", fields: [approvedById], references: [id])
  approvalsGiven User[]   @relation("UserApprovals")

  @@index([isApproved])
}
```

2. **No additional tables needed** - Rate limiting and password reset skipped for MVP

### Updated AuditAction enum:
```prisma
enum AuditAction {
  // ... existing actions
  LOGIN
  LOGOUT
  REGISTER
  USER_APPROVED
  USER_REJECTED
  // ... rest
}
```

## Implementation Steps

### Phase 1: Core Auth Configuration (2-3 hours) ✅ COMPLETED

#### 1.1 TypeScript Type Extensions ✅
**File:** `src/types/next-auth.d.ts`
- Extend NextAuth session to include `id`, `role`, and `isApproved`
- Add JWT token types with role information

#### 1.2 NextAuth Configuration ✅
**File:** `src/lib/auth.ts`
- Configure JWT session strategy (30-day expiry)
- Set up Credentials provider with email/password
- Implement `authorize()` function:
  - Check if user exists
  - Verify password with bcrypt
  - **Check isApproved status** - reject if not approved
  - Return user data for session
- Configure callbacks:
  - `jwt()` - Add user ID and role to token
  - `session()` - Expose user data to client
- Add event handlers for audit logging:
  - `signIn` event → log LOGIN action
  - `signOut` event → log LOGOUT action
- Set custom pages:
  - signIn: `/auth/login`
  - error: `/auth/error`

#### 1.3 NextAuth API Route Handler ✅
**File:** `src/app/api/auth/[...nextauth]/route.ts`
- Export GET and POST handlers using authOptions

### Phase 2: User Registration with Approval (2 hours) 🔄 IN PROGRESS

#### 2.1 Validation Schemas ✅
**File:** `src/lib/validations/auth.ts`
- Create Zod schemas:
  - `registerSchema` - email, password (8+ chars with complexity), name, role
  - `loginSchema` - email, password

#### 2.2 Registration API Route ✅
**File:** `src/app/api/auth/register/route.ts`
- Validate input with Zod
- Check if email already exists
- Hash password with bcrypt (12 rounds)
- Create user with `isApproved: false`
- Log REGISTER action to AuditLog
- Return success message: "Registration submitted. Please wait for admin approval."
- **Security:** Never reveal if email exists (prevent enumeration)

#### 2.3 Admin Approval API Routes 🔄
**File:** `src/app/api/admin/users/[userId]/approve/route.ts` ✅
- Require ADMIN role (middleware check)
- Update user: `isApproved: true`, `approvedAt`, `approvedById`
- Log USER_APPROVED action
- Return updated user

**File:** `src/app/api/admin/users/[userId]/reject/route.ts` ⏳
- Require ADMIN role
- Mark user as rejected (POST request, not DELETE)
- Keep user record for audit trail
- Log USER_REJECTED action

### Phase 3: Audit Logging (1 hour)

#### 3.1 Audit Logging Helper
**File:** `src/lib/audit.ts`
- `logAuthEvent()` function:
  - Parameters: action, userId, email, metadata (optional)
  - Create AuditLog entry with user info, IP, user agent
  - Handle errors gracefully (don't break auth flow)
- Integrate into:
  - Login events (success)
  - Logout events
  - Registration
  - User approval/rejection

### Phase 4: Middleware & Route Protection (1 hour)

#### 4.1 NextAuth Middleware
**File:** `middleware.ts`
- Use `withAuth` wrapper from NextAuth
- Public routes: `/`, `/auth/*`, `/api/auth/*`
- Protected routes: everything else requires authentication
- Role-based access:
  - `/admin/*` → ADMIN only
  - `/dentist/*` → DENTIST only
  - `/lab/*` → LAB only
- Redirect unauthorized users to `/unauthorized`
- Redirect unauthenticated users to `/auth/login?callbackUrl={path}`

#### 4.2 Server-Side Auth Helpers
**File:** `src/lib/auth-helpers.ts`
- `requireAuth()` - Get session or redirect to login
- `requireRole(allowedRoles)` - Check role or redirect to unauthorized
- `getCurrentUser()` - Get user or return null
- Usage: `const session = await requireAuth();` in Server Components

### Phase 5: UI Components (3-4 hours)

#### 5.1 SessionProvider Wrapper
**File:** `src/components/providers/SessionProvider.tsx`
- Client component wrapping NextAuth's SessionProvider
- Used in root layout

#### 5.2 Login Form
**File:** `src/components/auth/LoginForm.tsx`
- Client component with form state
- Call `signIn('credentials', { email, password })`
- Show error if user not approved: "Your account is pending admin approval"
- Show error for invalid credentials
- Redirect to dashboard on success

#### 5.3 Registration Form
**File:** `src/components/auth/RegisterForm.tsx`
- Form fields: name, email, password, confirm password, role (DENTIST/LAB)
- Password validation UI (show requirements)
- POST to `/api/auth/register`
- Success state: "Registration submitted! Please wait for admin approval."
- Error handling with clear messages

#### 5.4 Admin User Management UI
**File:** `src/components/admin/PendingUsers.tsx`
- Server Component fetching unapproved users
- Display table with: name, email, role, registration date
- Action buttons: Approve / Reject
- Optimistic UI updates

### Phase 6: Pages (2 hours)

#### 6.1 Auth Pages
**Files:**
- `src/app/auth/login/page.tsx` - Render LoginForm, redirect if already logged in
- `src/app/auth/register/page.tsx` - Render RegisterForm
- `src/app/auth/error/page.tsx` - Display auth errors with friendly messages
- `src/app/unauthorized/page.tsx` - 403 page with link to dashboard

#### 6.2 Admin Dashboard
**File:** `src/app/admin/users/page.tsx`
- Server Component with `requireRole([Role.ADMIN])`
- Fetch pending users from database
- Render PendingUsers component
- Show approved/rejected counts

#### 6.3 Update Root Layout
**File:** `src/app/layout.tsx`
- Wrap children with SessionProvider
- Keep existing Geist fonts and metadata

### Phase 7: Environment & Security (30 mins)

#### 7.1 Update Environment Variables ✅
**File:** `.env` (local only, not committed)
- Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- Set NEXTAUTH_URL to production domain when deploying

#### 7.2 Security Headers
**File:** `next.config.ts`
- Add security headers:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security (HSTS)
  - X-XSS-Protection
  - Referrer-Policy

## Database Migration

```bash
# Update Prisma schema with User.isApproved field
# Run migration
npx prisma migrate dev --name add_user_approval_status

# Generate Prisma Client
npx prisma generate
```

## Testing Checklist

### Manual Testing
- [ ] User can register (DENTIST and LAB roles)
- [ ] Registration shows "pending approval" message
- [ ] Unapproved user cannot login
- [ ] Admin can see pending users
- [ ] Admin can approve user
- [ ] Approved user can login successfully
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Protected routes redirect to login
- [ ] Role-based access control works (dentist can't access lab routes)
- [ ] Audit logs record all auth events

### Security Verification
- [ ] Passwords are hashed (never stored in plaintext)
- [ ] JWT tokens are httpOnly cookies
- [ ] CSRF protection is active
- [ ] Email enumeration prevented (same response for existing/non-existing emails)
- [ ] Security headers present in response

## Implementation Sequence

1. **Day 1 Morning:** Phase 1 (Core Auth Configuration) ✅
2. **Day 1 Afternoon:** Phase 2 (Registration with Approval) 🔄
3. **Day 2 Morning:** Phase 3 + 4 (Audit Logging + Middleware)
4. **Day 2 Afternoon:** Phase 5 (UI Components)
5. **Day 3 Morning:** Phase 6 (Pages)
6. **Day 3 Afternoon:** Phase 7 (Security) + Testing

**Total Estimated Time:** 2-3 days

## Critical Files to Modify

### New Files (Create)
1. ✅ `src/lib/auth.ts` - NextAuth core configuration
2. ✅ `src/types/next-auth.d.ts` - TypeScript types
3. `src/lib/auth-helpers.ts` - Server-side auth utilities
4. ✅ `src/lib/validations/auth.ts` - Zod schemas
5. `src/lib/audit.ts` - Audit logging helper
6. ✅ `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
7. ✅ `src/app/api/auth/register/route.ts` - Registration endpoint
8. ✅ `src/app/api/admin/users/[userId]/approve/route.ts` - Approval endpoint
9. ⏳ `src/app/api/admin/users/[userId]/reject/route.ts` - Rejection endpoint
10. `src/components/providers/SessionProvider.tsx` - Session provider
11. `src/components/auth/LoginForm.tsx` - Login UI
12. `src/components/auth/RegisterForm.tsx` - Registration UI
13. `src/components/admin/PendingUsers.tsx` - Admin UI for approvals
14. `src/app/auth/login/page.tsx` - Login page
15. `src/app/auth/register/page.tsx` - Registration page
16. `src/app/auth/error/page.tsx` - Error page
17. `src/app/unauthorized/page.tsx` - 403 page
18. `src/app/admin/users/page.tsx` - Admin user management
19. `middleware.ts` - Route protection

### Files to Modify
1. ✅ `prisma/schema.prisma` - Add User.isApproved, approvedAt, approvedById, update AuditAction enum
2. `src/app/layout.tsx` - Add SessionProvider wrapper
3. `next.config.ts` - Add security headers
4. ✅ `.env` - Add NEXTAUTH_SECRET

## Future Enhancements (Post-MVP)

### Phase 2 Features
- Rate limiting (LoginAttempt table + logic)
- Email-based password reset
- Email notifications for approval
- Two-factor authentication (2FA)
- Session management (view active sessions, force logout)
- Social login providers (Google, Microsoft)
- API key authentication for integrations

### Admin Features
- Bulk user approval
- User deactivation (suspend without deleting)
- Permission management (granular beyond just role)
- Activity dashboard (login analytics)

## Security Notes

### MVP Security (Included)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT with httpOnly cookies
- ✅ CSRF protection (NextAuth built-in)
- ✅ Role-based access control
- ✅ Security headers
- ✅ Admin approval workflow (prevents spam accounts)
- ✅ Comprehensive audit logging

### Production Security (Add Later)
- ⏳ Rate limiting (prevent brute force)
- ⏳ Account lockout after failed attempts
- ⏳ Password complexity requirements UI
- ⏳ Session timeout policies
- ⏳ IP allow/deny lists
- ⏳ Monitoring and alerting for suspicious activity

## IP Address Tracking Notes

**How IP addresses are captured:**

The `x-forwarded-for` and `x-real-ip` headers are set by **reverse proxies/load balancers**:

- **Production (Vercel)**: Automatically sets `x-forwarded-for` with client's real IP
- **Local Development**: These headers will be `undefined` (direct connection, no proxy)

Example code:
```typescript
ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
```

**Security Note:** Only trust these headers in production environments where you control the proxy/load balancer.

## First Admin User Setup

Since registration requires approval, you'll need to manually create the first admin user:

```typescript
// Run this once via prisma studio or a script
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash('YourSecurePassword123!', 12);

await prisma.user.create({
  data: {
    email: 'admin@labwiselink.com',
    name: 'System Administrator',
    passwordHash,
    role: 'ADMIN',
    isApproved: true,
    approvedAt: new Date(),
  },
});
```

**⚠️ IMPORTANT:** Change this password immediately after first login!

## Error Handling Strategy

### User-Facing Errors
- **Invalid credentials:** "Invalid email or password"
- **Pending approval:** "Your account is pending admin approval. Please check back later."
- **Rejected account:** "Your account registration was not approved. Please contact support."
- **Network errors:** "Connection error. Please try again."

### Development Errors
- Console log full error in development
- Log errors to monitoring service in production
- Never expose stack traces to users

## Success Criteria

✅ **Authentication Working:**
- Users can register with DENTIST or LAB role
- Admin can approve/reject pending registrations
- Approved users can login successfully
- Unapproved users cannot login
- Sessions persist across browser refreshes

✅ **Authorization Working:**
- Routes are protected by authentication
- Role-based access control enforced
- Admins can access `/admin/*` routes
- Dentists/Labs cannot access admin routes

✅ **Audit Trail Complete:**
- All registrations logged
- All logins/logouts logged
- All approval/rejection actions logged
- Logs include user ID, IP address, user agent

✅ **Security Requirements:**
- Passwords never stored in plaintext
- JWT tokens use httpOnly cookies
- CSRF protection active
- Security headers present
- No email enumeration vulnerability

## Post-Implementation Checklist

- [x] Run database migration
- [x] Generate Prisma Client
- [ ] Create first admin user manually
- [ ] Test complete registration → approval → login flow
- [ ] Verify audit logs are being created
- [ ] Test all protected routes redirect correctly
- [ ] Test role-based access control
- [ ] Verify security headers in browser DevTools
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Document admin approval workflow for operations team
- [ ] Create user documentation for registration process
- [ ] Set up monitoring for failed login attempts (manual review)
