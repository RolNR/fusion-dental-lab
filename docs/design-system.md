# Design System Guide - LabWiseLink

## Overview

LabWiseLink uses a **semantic color system** built with CSS variables and Tailwind CSS. This approach allows for:

- Easy theme customization by changing CSS variables
- Dark mode support (ready for implementation)
- Consistent design across the application
- Better maintainability with clear color purposes

---

## Core Principles

### ✅ DO: Use Semantic Color Names

Semantic colors describe **purpose**, not appearance:

```tsx
// ✅ CORRECT - Describes purpose
<button className="bg-primary text-primary-foreground">Guardar</button>
<div className="bg-danger/10 text-danger">Error message</div>
<p className="text-muted-foreground">Secondary text</p>
```

### ❌ DON'T: Use Hardcoded Colors

Never use color-specific class names:

```tsx
// ❌ WRONG - Hardcoded colors
<button className="bg-blue-600 text-white">Guardar</button>
<div className="bg-red-50 text-red-800">Error message</div>
<p className="text-gray-500">Secondary text</p>
```

---

## Available Semantic Colors

### Primary (Brand Color)

Use for main actions, links, and brand elements.

**Classes:**
- `bg-primary` - Primary background
- `bg-primary-hover` - Hover state background
- `text-primary` - Primary text color
- `text-primary-foreground` - Text on primary background (white)
- `border-primary` - Primary border
- `focus:ring-primary` - Focus ring color

**Usage:**
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
  Iniciar Sesión
</button>

<a href="/register" className="text-primary hover:text-primary-hover">
  Regístrate aquí
</a>

<input className="focus:border-primary focus:ring-primary" />
```

---

### Secondary

Use for secondary actions and alternative UI elements.

**Classes:**
- `bg-secondary` - Secondary background
- `bg-secondary-hover` - Hover state background
- `text-secondary` - Secondary text color
- `text-secondary-foreground` - Text on secondary background
- `border-secondary` - Secondary border

**Usage:**
```tsx
<button className="bg-secondary text-secondary-foreground hover:bg-secondary-hover">
  Cancelar
</button>
```

---

### Danger (Errors & Destructive Actions)

Use for errors, delete actions, and warnings about destructive operations.

**Classes:**
- `bg-danger` - Danger background (full)
- `bg-danger-hover` - Hover state background
- `bg-danger/10` - Light danger background (10% opacity)
- `text-danger` - Danger text color
- `text-danger-foreground` - Text on danger background
- `border-danger` - Danger border
- `border-danger/50` - Light danger border (50% opacity)

**Usage:**
```tsx
{/* Error message */}
<div className="rounded-md bg-danger/10 p-4">
  <p className="text-sm text-danger">Correo electrónico o contraseña inválidos</p>
</div>

{/* Delete button */}
<button className="bg-danger text-danger-foreground hover:bg-danger-hover">
  Eliminar
</button>

{/* Error input */}
<input className="border-danger/50 focus:border-danger focus:ring-danger" />
```

---

### Success

Use for success messages and positive feedback.

**Classes:**
- `bg-success` - Success background (full)
- `bg-success-hover` - Hover state background
- `bg-success/10` - Light success background (10% opacity)
- `text-success` - Success text color
- `text-success-foreground` - Text on success background
- `border-success` - Success border

**Usage:**
```tsx
{/* Success message */}
<div className="rounded-md bg-success/10 p-6 text-center">
  <h3 className="text-lg font-semibold text-success mb-2">
    ¡Registro exitoso!
  </h3>
  <p className="text-sm text-success">
    Tu cuenta ha sido creada exitosamente.
  </p>
</div>
```

---

### Warning

Use for warnings and caution messages.

**Classes:**
- `bg-warning` - Warning background (full)
- `bg-warning-hover` - Hover state background
- `bg-warning/10` - Light warning background (10% opacity)
- `text-warning` - Warning text color
- `text-warning-foreground` - Text on warning background (usually black)
- `border-warning` - Warning border

**Usage:**
```tsx
<div className="rounded-md bg-warning/10 p-4">
  <p className="text-sm text-warning">
    Esta acción no se puede deshacer.
  </p>
</div>
```

---

### UI/Neutral Colors

Use for general UI elements, backgrounds, and text.

#### Background & Foreground

**Classes:**
- `bg-background` - Main background color (cards, containers)
- `text-foreground` - Main text color (primary text)

**Usage:**
```tsx
{/* Card or container */}
<div className="rounded-lg bg-background p-6 shadow border border-border">
  <h2 className="text-lg font-semibold text-foreground">Título</h2>
</div>
```

#### Muted (Secondary UI)

**Classes:**
- `bg-muted` - Muted background (page backgrounds, table headers)
- `text-muted-foreground` - Muted text (secondary text, labels)

**Usage:**
```tsx
{/* Page background */}
<div className="min-h-screen bg-muted">
  {/* Content */}
</div>

{/* Secondary text */}
<p className="text-sm text-muted-foreground">
  Información adicional o secundaria
</p>

{/* Table header */}
<thead className="bg-muted">
  <th className="text-xs uppercase text-muted-foreground">Nombre</th>
</thead>
```

#### Borders

**Classes:**
- `border-border` - General border color
- `border-border-input` - Input border color

**Usage:**
```tsx
{/* Card with border */}
<div className="rounded-lg border border-border bg-background p-6">
  Content
</div>

{/* Input border */}
<input className="border-border-input focus:border-primary" />
```

---

## Common Patterns

### Error Messages

```tsx
{error && (
  <div className="rounded-md bg-danger/10 p-4">
    <p className="text-sm text-danger">{error}</p>
  </div>
)}
```

### Success Messages

```tsx
{success && (
  <div className="rounded-md bg-success/10 p-6 text-center">
    <h3 className="text-lg font-semibold text-success mb-2">
      ¡Éxito!
    </h3>
    <p className="text-sm text-success">
      Operación completada exitosamente.
    </p>
  </div>
)}
```

### Cards

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
<div className="min-h-screen bg-muted py-12 px-4">
  <div className="mx-auto max-w-7xl">
    <h1 className="text-3xl font-bold text-foreground">Título de la página</h1>
    <p className="mt-2 text-sm text-muted-foreground">Descripción</p>
  </div>
</div>
```

### Tables

```tsx
<div className="overflow-hidden rounded-lg border border-border bg-background shadow">
  <table className="min-w-full divide-y divide-border">
    <thead className="bg-muted">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
          Nombre
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border bg-background">
      <tr>
        <td className="px-6 py-4 text-sm font-medium text-foreground">
          Valor
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Form Inputs with Validation

```tsx
<Input
  label="Correo electrónico"
  error={errors.email}
  className={errors.email ? "border-danger/50 focus:border-danger" : ""}
/>

{/* Input component already handles semantic colors internally */}
```

---

## Opacity Modifiers

Use opacity modifiers for lighter variants:

```tsx
{/* 10% opacity for light backgrounds */}
<div className="bg-danger/10">Light error background</div>
<div className="bg-success/10">Light success background</div>
<div className="bg-warning/10">Light warning background</div>

{/* 50% opacity for subtle borders */}
<input className="border-danger/50" />
```

---

## Customizing the Theme

All colors are defined in `src/app/globals.css` using CSS variables.

### Changing the Primary Color

To change the primary brand color (e.g., from blue to purple):

1. Open `src/app/globals.css`
2. Find the `:root` section
3. Update the `--color-primary` values:

```css
@layer base {
  :root {
    /* Change from blue to purple */
    --color-primary: 168 85 247; /* purple-500 */
    --color-primary-hover: 147 51 234; /* purple-600 */
    --color-primary-foreground: 255 255 255; /* white */
  }
}
```

The entire application will update automatically!

### Color Format

Colors use RGB values **without** the `rgb()` wrapper to support Tailwind opacity modifiers:

```css
/* ✅ CORRECT - Allows opacity modifiers like bg-primary/50 */
--color-primary: 59 130 246;

/* ❌ WRONG - Breaks opacity modifiers */
--color-primary: rgb(59, 130, 246);
```

### Available Color Variables

```css
/* Primary brand colors */
--color-primary: 59 130 246;
--color-primary-hover: 37 99 235;
--color-primary-foreground: 255 255 255;

/* Secondary colors */
--color-secondary: 107 114 128;
--color-secondary-hover: 75 85 99;
--color-secondary-foreground: 255 255 255;

/* Danger/Error colors */
--color-danger: 239 68 68;
--color-danger-hover: 220 38 38;
--color-danger-foreground: 255 255 255;

/* Success colors */
--color-success: 34 197 94;
--color-success-hover: 22 163 74;
--color-success-foreground: 255 255 255;

/* Warning colors */
--color-warning: 251 191 36;
--color-warning-hover: 245 158 11;
--color-warning-foreground: 0 0 0;

/* Neutral/UI colors */
--color-background: 255 255 255;
--color-foreground: 17 24 39;
--color-muted: 243 244 246;
--color-muted-foreground: 107 114 128;

/* Border colors */
--color-border: 229 231 235;
--color-border-input: 209 213 219;

/* Input colors */
--color-input-background: 255 255 255;
--color-input-foreground: 17 24 39;
--color-input-placeholder: 107 114 128;

/* Focus ring */
--color-focus-ring: 59 130 246;
```

---

## Dark Mode (Future)

Dark mode tokens are already defined in `globals.css`:

```css
.dark {
  --color-primary: 96 165 250; /* Lighter blue for dark bg */
  --color-primary-hover: 59 130 246;

  --color-background: 17 24 39; /* Dark gray */
  --color-foreground: 243 244 246; /* Light gray */
  --color-muted: 31 41 55;
  --color-muted-foreground: 156 163 175;

  --color-border: 55 65 81;
  --color-border-input: 75 85 99;

  --color-input-background: 31 41 55;
  --color-input-foreground: 243 244 246;
}
```

To enable dark mode, just add the `.dark` class to the `<html>` or `<body>` element.

---

## UI Component Integration

All custom UI components use semantic colors by default:

### Button Component

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary">Uses bg-primary</Button>
<Button variant="secondary">Uses bg-secondary</Button>
<Button variant="danger">Uses bg-danger</Button>
<Button variant="ghost">Uses bg-transparent with text-foreground</Button>
```

### Input, PasswordInput, Select Components

All form components automatically use:
- `text-input-foreground` for text
- `border-border-input` for borders
- `focus:border-primary` for focus state
- `text-danger` for error messages
- `text-muted-foreground` for helper text

You don't need to add color classes manually when using these components.

---

## Quick Reference

| Purpose | Background | Text | Border |
|---------|-----------|------|--------|
| Main content | `bg-background` | `text-foreground` | `border-border` |
| Page background | `bg-muted` | - | - |
| Secondary text | - | `text-muted-foreground` | - |
| Primary action | `bg-primary` | `text-primary-foreground` | `border-primary` |
| Error message | `bg-danger/10` | `text-danger` | `border-danger/50` |
| Success message | `bg-success/10` | `text-success` | `border-success` |
| Warning message | `bg-warning/10` | `text-warning` | `border-warning` |
| Form inputs | `bg-input` | `text-input-foreground` | `border-border-input` |
| Focus state | - | - | `focus:ring-primary` |

---

## Benefits

✅ **Easy theme changes** - Change one CSS variable, entire app updates
✅ **Dark mode ready** - `.dark` class styles already defined
✅ **Consistent design** - Semantic naming ensures proper color usage
✅ **Better maintainability** - Clear purpose for each color
✅ **Designer-friendly** - Non-developers can modify CSS variables
✅ **Future-proof** - Easy to add new themes or brand colors

---

## Migration from Hardcoded Colors

If you find hardcoded colors in existing code, use this mapping:

| Old (Hardcoded) | New (Semantic) |
|-----------------|----------------|
| `bg-blue-600` | `bg-primary` |
| `bg-blue-700` | `bg-primary-hover` |
| `bg-gray-50` | `bg-muted` |
| `bg-gray-100` | `bg-muted` |
| `text-gray-900` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border-input` |
| `bg-red-50` | `bg-danger/10` |
| `text-red-800` | `text-danger` |
| `bg-green-50` | `bg-success/10` |
| `text-green-800` | `text-success` |
| `text-blue-600` | `text-primary` |
| `focus:ring-blue-500` | `focus:ring-primary` |

---

## Need Help?

- See `src/app/globals.css` for all CSS variable definitions
- Check `.claude/instructions.md` for component usage guidelines
- Look at existing components in `src/components/` for examples
- Refer to `src/components/ui/` for base component implementations
