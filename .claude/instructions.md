# LabWiseLink - Claude Instructions

## Project Overview
LabWiseLink is a dental lab order management platform connecting dentists and dental labs.
- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Prisma 6, PostgreSQL
- **Language**: All user-facing content must be in **Spanish**
- **Authentication**: NextAuth.js with JWT sessions and admin approval workflow

## Component Architecture

### UI Components (src/components/ui/)
We have standardized UI components that **MUST** be used throughout the application:

#### 1. Input Component (`src/components/ui/Input.tsx`)
**Always use this for form inputs. Never create inline input elements.**

```tsx
import { Input } from '@/components/ui/Input';

<Input
  id="email"
  name="email"
  type="email"
  label="Correo electrónico"
  required
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="tu@ejemplo.com"
  disabled={isLoading}
  error={errors.email}
  helperText="Texto de ayuda opcional"
/>
```

**Features:**
- Built-in label with required asterisk
- Error message display
- Helper text support
- Semantic color styling (uses design system colors)
- Disabled states

#### 2. PasswordInput Component (`src/components/ui/PasswordInput.tsx`)
**Always use this for password inputs. Never use Input with type="password".**

```tsx
import { PasswordInput } from '@/components/ui/PasswordInput';

<PasswordInput
  id="password"
  name="password"
  label="Contraseña"
  required
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  placeholder="••••••••"
  disabled={isLoading}
  error={errors.password}
  helperText="Mínimo 8 caracteres"
/>
```

**Features:**
- Built-in show/hide password toggle with eye icon
- Same features as Input component (label, error, helper text)
- Consistent styling
- Client component (uses useState for toggle)

#### 3. Select Component (`src/components/ui/Select.tsx`)
**Always use this for select dropdowns. Never create inline select elements.**

```tsx
import { Select } from '@/components/ui/Select';

<Select
  id="role"
  name="role"
  label="Tipo de cuenta"
  required
  value={formData.role}
  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
  disabled={isLoading}
  error={errors.role}
  helperText="Texto de ayuda opcional"
>
  <option value="">Selecciona una opción</option>
  <option value="option1">Opción 1</option>
  <option value="option2">Opción 2</option>
</Select>
```

**Features:**
- Built-in label with required asterisk
- Error message display
- Helper text support
- Semantic color styling (uses design system colors)
- Disabled states

#### 4. Button Component (`src/components/ui/Button.tsx`)
**Always use this for buttons. Never create inline button elements.**

```tsx
import { Button } from '@/components/ui/Button';

<Button
  type="submit"
  variant="primary" // primary | secondary | danger | ghost
  size="md" // sm | md | lg
  isLoading={isLoading}
  disabled={false}
  className="w-full"
>
  Iniciar sesión
</Button>
```

**Features:**
- Variants: primary, secondary, danger, ghost (all use semantic colors from design system)
- Sizes: sm, md, lg
- Built-in loading state with spinner icon
- Consistent focus states and transitions

#### 5. Icons Component (`src/components/ui/Icons.tsx`)
**All SVG icons MUST be added to this centralized file. Never inline SVGs.**

```tsx
import { Icons } from '@/components/ui/Icons';

// Usage:
<Icons.spinner className="h-4 w-4 animate-spin" />
<Icons.user size={24} />
```

**When adding new icons:**
1. Add to the `Icons` object in `src/components/ui/Icons.tsx`
2. Follow the existing pattern with `size` prop and spread `...props`
3. Use consistent viewBox="0 0 24 24"
4. Keep stroke-width="2" for consistency

**Available icons:**
- spinner, check, x, alertCircle
- eye, eyeOff
- user, mail, lock

## Content Guidelines

### Language: Spanish
All user-facing text MUST be in Spanish:

**Common translations:**
- Login → Iniciar sesión
- Sign up / Register → Registrarse
- Email → Correo electrónico
- Password → Contraseña
- Submit → Enviar
- Cancel → Cancelar
- Save → Guardar
- Delete → Eliminar
- Edit → Editar
- Create → Crear
- Update → Actualizar
- Success → Éxito
- Error → Error
- Loading → Cargando
- Please wait → Por favor espera
- Required field → Campo requerido

### Form Validation Messages (Spanish)
```tsx
// Example validation errors
"El correo electrónico es requerido"
"La contraseña debe tener al menos 8 caracteres"
"Las contraseñas no coinciden"
"Campo requerido"
"Formato de correo inválido"
```

## Code Style & Conventions

### File Naming
- Components: PascalCase (e.g., `LoginForm.tsx`, `PendingUsers.tsx`)
- Utilities/Helpers: kebab-case (e.g., `auth-helpers.ts`, `audit.ts`)
- Pages: lowercase (e.g., `page.tsx`, `route.ts`)

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Internal components (`@/components/*`)
4. Internal utilities (`@/lib/*`)
5. Types/Interfaces
6. Styles (if any)

```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
```

### TypeScript
- Always use explicit types for function parameters and return values
- Avoid `any` - use `unknown` if type is truly unknown
- Use Zod for runtime validation
- Prefer interfaces over types for object shapes

## Authentication Patterns

### Server Components (Pages)
```tsx
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

// Require authentication
const session = await requireAuth();

// Require specific role
const session = await requireRole([Role.ADMIN]);

// Optional auth check
const user = await getCurrentUser();
```

### Client Components (Forms)
```tsx
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

// Sign in
const result = await signIn('credentials', {
  email,
  password,
  redirect: false,
});

// Get session in client
const { data: session, status } = useSession();
```

## Database Patterns

### Prisma Queries
- Always use `prisma` from `@/lib/prisma`
- Use `select` to only fetch needed fields
- Add proper error handling with try-catch
- Use transactions for multi-step operations

```tsx
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
  },
});
```

## Audit Logging

Always log important actions using audit helpers:

```tsx
import { logAuthEvent, logOrderEvent, getAuditContext } from '@/lib/audit';

// Auth events
await logAuthEvent('LOGIN', userId, email, {
  ...getAuditContext(request),
  metadata: { name: user.name },
});

// Order events
await logOrderEvent('CREATE', userId, orderId, null, orderData, {
  ...getAuditContext(request),
});
```

## Error Handling

### API Routes
```tsx
try {
  // ... logic
  return NextResponse.json({ data }, { status: 200 });
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Error de validación',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Ocurrió un error inesperado' },
    { status: 500 }
  );
}
```

## Key Project Rules

1. **Always use custom Input, PasswordInput, Select, and Button components** - Never create inline form elements
2. **All icons must be in Icons.tsx** - No inline SVGs
3. **All content in Spanish** - Including error messages, labels, and UI text
4. **Use auth helpers** - requireAuth(), requireRole(), getCurrentUser()
5. **Log important actions** - Use audit logging helpers
6. **Avoid unknown types** - Prefer proper typing over `unknown`
7. **Build must always pass** - Run `npm run build` before committing

## Routes Structure

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/error` - Auth error page
- `/unauthorized` - 403 page
- `/admin/*` - Admin-only routes (requires ADMIN role)
- `/doctor/*` - Dentist routes (requires DENTIST role)
- `/lab/*` - Lab routes (requires LAB role)
- `/dashboard` - Main dashboard (authenticated users)

## Design System & Theming

LabWiseLink uses a **semantic color system** with CSS variables for easy theme customization.

### Semantic Color Usage

**ALWAYS use semantic color classes. NEVER use hardcoded color classes.**

#### Correct (Semantic Colors):
```tsx
// ✅ DO - Use semantic colors
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
<div className="text-foreground">Main text</div>
<div className="text-muted-foreground">Secondary text</div>
<div className="bg-danger/10 text-danger">Error message</div>
<input className="border-border-input focus:ring-primary" />
```

#### Incorrect (Hardcoded Colors):
```tsx
// ❌ DON'T - Use hardcoded colors
<button className="bg-blue-600 text-white hover:bg-blue-700">
<div className="text-gray-900">Main text</div>
<div className="text-gray-500">Secondary text</div>
<div className="bg-red-50 text-red-800">Error message</div>
<input className="border-gray-300 focus:ring-blue-500" />
```

### Available Semantic Colors

**Primary (brand color):**
- `bg-primary`, `text-primary`, `border-primary`
- `bg-primary-hover`, `text-primary-foreground`
- `focus:ring-primary`

**Secondary:**
- `bg-secondary`, `text-secondary`, `border-secondary`
- `bg-secondary-hover`, `text-secondary-foreground`

**Danger (errors, delete actions):**
- `bg-danger`, `text-danger`, `border-danger`
- `bg-danger-hover`, `text-danger-foreground`
- `bg-danger/10` (light error background)

**Success:**
- `bg-success`, `text-success`, `border-success`
- `bg-success-hover`, `text-success-foreground`
- `bg-success/10` (light success background)

**Warning:**
- `bg-warning`, `text-warning`, `border-warning`
- `bg-warning-hover`, `text-warning-foreground`

**UI/Neutral colors:**
- `bg-background`, `text-foreground` (main content)
- `bg-muted`, `text-muted-foreground` (secondary content)
- `border-border`, `border-border-input`

### Color Guidelines

1. **Backgrounds**: Use `bg-background` for cards/containers, `bg-muted` for page backgrounds
2. **Text**: Use `text-foreground` for primary text, `text-muted-foreground` for secondary text
3. **Borders**: Use `border-border` for general borders, `border-border-input` for form inputs
4. **States**: Use semantic variants like `bg-danger/10` for light backgrounds with opacity
5. **Buttons**: Already handled by Button component variants

### Why Semantic Colors?

- **Easy theme changes**: Change one CSS variable to update entire app
- **Dark mode ready**: Just add `.dark` class styles
- **Consistent design**: Semantic naming ensures proper color usage
- **Better maintainability**: Clear purpose for each color

See `docs/design-system-plan.md` for complete implementation details.

## Remember
- Middleware protects routes automatically
- Users must be approved by admin before login
- JWT sessions last 30 days
- Prisma 6 is used (not Prisma 7)
- Next.js 16 with Turbopack for dev
- **ALWAYS use semantic colors, NEVER hardcoded colors**
