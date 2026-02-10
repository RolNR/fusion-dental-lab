# Design System

**Framework**: Tailwind CSS 4
**Component Pattern**: Custom UI components with semantic colors
**Language**: Spanish (all user-facing text)
**Last Updated**: 2026-01-30

## Core Principles

### CRITICAL RULES

1. **ALWAYS use custom UI components** - Never create inline `<input>`, `<select>`, `<button>`, `<textarea>`
2. **ALL icons in Icons.tsx** - Never inline `<svg>` elements
3. **ALWAYS use semantic colors** - Never hardcoded colors like `bg-blue-600`, `text-gray-900`
4. **NO emojis** unless explicitly requested by user

## Semantic Color System

### Why Semantic Colors?

Allows easy theming and consistency. Instead of hardcoded colors, use semantic names:

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

### Color Token Reference

**Primary (brand actions, CTAs)**
- `bg-primary`, `text-primary`, `border-primary`, `focus:ring-primary`
- `bg-primary-hover`, `text-primary-foreground`

**Danger (errors, delete actions)**
- `bg-danger`, `text-danger`, `border-danger`
- `bg-danger-hover`, `text-danger-foreground`
- `bg-danger/10` (light error background)

**Success**
- `bg-success`, `text-success`, `bg-success/10`

**Warning**
- `bg-warning`, `text-warning`, `bg-warning/10`

**UI/Neutral**
- `bg-background`, `text-foreground` (main content)
- `bg-muted`, `text-muted-foreground` (secondary)
- `border-border`, `border-border-input`

## UI Components

**Location**: `src/components/ui/`

### Input Component

**File**: `src/components/ui/Input.tsx`

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Correo electrónico"
  required
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  error={errors.email}
  placeholder="tu@ejemplo.com"
  helperText="Ingresa tu correo corporativo"
/>
```

**Props:**
- `label?: string` - Input label
- `required?: boolean` - Shows asterisk, adds HTML required
- `error?: string` - Error message (displays below input)
- `helperText?: string` - Helper text below input
- All standard HTML input props

### PasswordInput Component

**File**: `src/components/ui/PasswordInput.tsx`

```tsx
import { PasswordInput } from '@/components/ui/PasswordInput';

<PasswordInput
  label="Contraseña"
  required
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  error={errors.password}
/>
```

**Features:**
- Show/hide password toggle
- Eye icon button
- All Input component features

### Select Component

**File**: `src/components/ui/Select.tsx`

```tsx
import { Select } from '@/components/ui/Select';

<Select
  label="Tipo de caso"
  required
  value={formData.tipoCaso}
  onChange={(e) => setFormData({ ...formData, tipoCaso: e.target.value })}
  error={errors.tipoCaso}
>
  <option value="">Selecciona una opción</option>
  <option value="nuevo">Nuevo</option>
  <option value="garantia">Garantía</option>
</Select>
```

### Button Component

**File**: `src/components/ui/Button.tsx`

```tsx
import { Button } from '@/components/ui/Button';

<Button
  type="submit"
  variant="primary"
  size="md"
  isLoading={isLoading}
  disabled={!isValid}
>
  Guardar cambios
</Button>
```

**Props:**
- `variant`: `'primary'` | `'secondary'` | `'danger'` | `'ghost'`
- `size`: `'sm'` | `'md'` | `'lg'`
- `isLoading?: boolean` - Shows spinner, disables button
- `disabled?: boolean`

**Variants:**
- **primary**: Primary action (brand color)
- **secondary**: Secondary action (neutral)
- **danger**: Destructive action (red)
- **ghost**: Minimal styling (transparent)

### Icons Component

**File**: `src/components/ui/Icons.tsx`

```tsx
import { Icons } from '@/components/ui/Icons';

// Loading/Status
<Icons.spinner className="h-4 w-4 animate-spin" />
<Icons.check className="h-5 w-5 text-success" />
<Icons.x className="h-5 w-5 text-danger" />
<Icons.alertCircle className="h-6 w-6 text-warning" />

// UI
<Icons.eye className="h-5 w-5" />
<Icons.eyeOff className="h-5 w-5" />
<Icons.user className="h-5 w-5" />
<Icons.mail className="h-5 w-5" />
<Icons.lock className="h-5 w-5" />
```

**Adding new icons:**
1. Open `src/components/ui/Icons.tsx`
2. Add SVG as a component
3. Export in the `Icons` object
4. Use semantic colors for styling

**Never inline SVG icons** - always add to Icons.tsx

### Chart Components

**File**: `src/components/ui/PieChart.tsx`

```tsx
import { PieChart } from '@/components/ui/PieChart';

<PieChart
  segments={[
    { value: 75, color: 'hsl(var(--primary))', label: 'Con IA' },
    { value: 25, color: 'hsl(var(--muted))', label: 'Manual' },
  ]}
  size={220}
/>
```

**File**: `src/components/ui/HorizontalBarChart.tsx`

```tsx
import { HorizontalBarChart } from '@/components/ui/HorizontalBarChart';

<HorizontalBarChart
  items={[
    { label: 'Dr. García', value: 45 },
    { label: 'Dr. Martínez', value: 32 },
  ]}
  showPercentage={true}
/>
```

## Common UI Patterns

### Error Message

```tsx
{error && (
  <div className="rounded-md bg-danger/10 p-4">
    <div className="flex">
      <Icons.alertCircle className="h-5 w-5 text-danger" />
      <p className="ml-3 text-sm text-danger">{error}</p>
    </div>
  </div>
)}
```

### Success Message

```tsx
{success && (
  <div className="rounded-md bg-success/10 p-6">
    <div className="flex">
      <Icons.check className="h-5 w-5 text-success" />
      <p className="ml-3 text-sm text-success">{message}</p>
    </div>
  </div>
)}
```

### Card Container

```tsx
<div className="rounded-lg bg-background p-6 shadow border border-border">
  <h2 className="text-lg font-semibold text-foreground mb-4">
    Título de la tarjeta
  </h2>
  <p className="text-sm text-muted-foreground">
    Contenido secundario
  </p>
</div>
```

### Page Layout

```tsx
<div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-7xl">
    <h1 className="text-3xl font-bold text-foreground">
      Título de la página
    </h1>
    <p className="mt-2 text-muted-foreground">
      Descripción de la página
    </p>

    {/* Content */}
  </div>
</div>
```

### Form Layout

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Input
    label="Nombre"
    required
    value={formData.name}
    onChange={handleChange}
    error={errors.name}
  />

  <Select
    label="Tipo"
    required
    value={formData.type}
    onChange={handleChange}
  >
    <option value="">Selecciona...</option>
  </Select>

  <div className="flex gap-4">
    <Button type="button" variant="secondary" onClick={onCancel}>
      Cancelar
    </Button>
    <Button type="submit" variant="primary" isLoading={isSubmitting}>
      Guardar
    </Button>
  </div>
</form>
```

### Loading State

```tsx
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-3 text-muted-foreground">Cargando...</span>
  </div>
) : (
  <div>{content}</div>
)}
```

### Empty State

```tsx
<div className="text-center py-12">
  <Icons.alertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
  <h3 className="mt-2 text-sm font-medium text-foreground">
    No hay resultados
  </h3>
  <p className="mt-1 text-sm text-muted-foreground">
    Comienza creando un nuevo elemento
  </p>
  <div className="mt-6">
    <Button variant="primary" onClick={onCreate}>
      Crear nuevo
    </Button>
  </div>
</div>
```

### Status Badge

```tsx
const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_REVIEW: 'bg-warning/10 text-warning',
  IN_PROGRESS: 'bg-primary text-primary-foreground',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

<span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[status]}`}>
  {statusLabel}
</span>
```

## Typography

```tsx
// Headings
<h1 className="text-3xl font-bold text-foreground">Page Title</h1>
<h2 className="text-2xl font-semibold text-foreground">Section</h2>
<h3 className="text-lg font-medium text-foreground">Subsection</h3>

// Body text
<p className="text-base text-foreground">Primary content</p>
<p className="text-sm text-muted-foreground">Secondary content</p>
<p className="text-xs text-muted-foreground">Helper text</p>

// Links
<a href="#" className="text-primary hover:underline">Link text</a>
```

## Spacing

```tsx
// Consistent spacing scale
space-y-2   // 0.5rem (8px)
space-y-4   // 1rem (16px)
space-y-6   // 1.5rem (24px)
space-y-8   // 2rem (32px)

// Common patterns
className="space-y-6"  // Form fields
className="space-y-4"  // List items
className="gap-4"      // Flex/Grid gaps
```

## Responsive Design

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Title
</h1>
```

## Spanish Language Requirements

**All user-facing text MUST be in Spanish:**

```tsx
// ✅ CORRECT
<Button>Guardar</Button>
<Input label="Correo electrónico" placeholder="Ingresa tu correo" />
error: "El campo es requerido"

// ❌ WRONG
<Button>Save</Button>
<Input label="Email" placeholder="Enter your email" />
error: "Field is required"
```

**Common translations:**
- Login → Iniciar sesión
- Sign up → Registrarse
- Email → Correo electrónico
- Password → Contraseña
- Submit → Enviar
- Cancel → Cancelar
- Save → Guardar
- Delete → Eliminar
- Edit → Editar
- Loading → Cargando
- Error → Error
- Success → Éxito

## Component Organization

```
src/components/
├── ui/                  # Shared UI primitives (ALWAYS use these)
│   ├── Input.tsx
│   ├── PasswordInput.tsx
│   ├── Select.tsx
│   ├── Button.tsx
│   ├── Icons.tsx
│   ├── PieChart.tsx
│   └── HorizontalBarChart.tsx
├── lab-admin/          # Lab admin specific components
├── doctor/             # Doctor specific components
└── orders/             # Order-related (shared by both roles)
```

## Code Quality Checklist

Before committing:

- ✅ Using custom UI components (not inline inputs/buttons)
- ✅ All icons in Icons.tsx (no inline SVG)
- ✅ Semantic colors only (no hardcoded colors)
- ✅ Spanish language for all user-facing text
- ✅ No emojis (unless explicitly requested)
- ✅ Accessible markup (labels, aria-attributes)
- ✅ Responsive design (mobile-first)

## Key Files

| File | Purpose |
|------|---------|
| `src/components/ui/Input.tsx` | Text input component |
| `src/components/ui/PasswordInput.tsx` | Password with show/hide |
| `src/components/ui/Select.tsx` | Dropdown select |
| `src/components/ui/Button.tsx` | Button with variants |
| `src/components/ui/Icons.tsx` | Centralized icon library |
| `src/components/ui/PieChart.tsx` | SVG pie chart |
| `src/components/ui/HorizontalBarChart.tsx` | Horizontal bar chart |
| `tailwind.config.ts` | Tailwind configuration with semantic colors |
| `src/app/globals.css` | Global styles and CSS variables |

## Toast Notifications

```tsx
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

showToast('Orden creada exitosamente', 'success');
showToast('Error al guardar', 'error');
showToast('Procesando...', 'info');
showToast('Advertencia', 'warning');
```

## Best Practices

1. **Consistency**: Use the same component everywhere (don't mix custom inputs with native inputs)
2. **Accessibility**: Always provide labels, use semantic HTML
3. **Mobile-first**: Design for mobile, enhance for desktop
4. **Semantic colors**: Makes theming easy, maintains consistency
5. **Component reuse**: Don't create one-off styled elements
6. **Spanish everywhere**: No English in user-facing UI
