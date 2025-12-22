# Code Review Checklist

This document provides a consolidated checklist for ensuring code quality, consistency, and adherence to project standards before committing code. It is distilled from the original agent instructions.

---

## 1. Design System & Frontend

### UI Components
- [ ] **Component Usage**: Use custom components from `src/components/ui` (`<Input>`, `<Button>`, `<Select>`, `<PasswordInput>`) instead of raw HTML elements (`<input>`, `<button>`, `<select>`).
- [ ] **Iconography**: All SVGs must be centralized in `src/components/ui/Icons.tsx` and used via `<Icons.iconName />`. No inline `<svg>` tags in components.
- [ ] **Spanish Language**: All user-facing text (labels, buttons, placeholders, errors) must be in Spanish.

### Styling & Theming
- [ ] **Semantic Colors**: Do NOT use hardcoded Tailwind colors (e.g., `bg-blue-500`, `text-gray-900`).
- [ ] **Semantic Colors**: MUST use semantic theme classes from the design system (e.g., `bg-primary`, `text-foreground`, `border-border-input`).
- [ ] **Responsiveness**: Layouts must be mobile-first. Use responsive prefixes (`sm:`, `md:`, `lg:`) for adapting to different screen sizes. Pay special attention to the `md:` breakpoint for tablets.
- [ ] **Responsive Stacks**: Use `flex-col sm:flex-row` for element groups that should stack on mobile.
- [ ] **Responsive Tables**: Tables should transform into a card view on mobile screens (e.g., hide table on mobile `hidden md:table`, show cards `block md:hidden`).

---

## 2. API Routes & Backend

### Authentication & Authorization
- [ ] **Route Protection**: Use `requireAuth()` or `requireRole()` helpers to protect routes.
- [ ] **Ownership Check**: For routes that modify a specific resource (e.g., `/api/orders/[orderId]`), ensure the logged-in user has permission to access that specific resource.
- [ ] **Correct HTTP Status Codes**:
    - `401 Unauthorized` if the user is not logged in.
    - `403 Forbidden` if the user is logged in but lacks permissions.
    - `404 Not Found` if the resource doesn't exist.

### Data Validation & Error Handling
- [ ] **Zod Validation**: All incoming request bodies and parameters must be validated with a Zod schema.
- [ ] **Prisma Enums in Zod**: When validating a field corresponding to a Prisma enum, use `z.nativeEnum(PrismaEnum)`. Do NOT use `z.enum(['VALUE_A', 'VALUE_B'])`.
- [ ] **Zod Error Handling**: Catch Zod errors and return a `400 Bad Request` response with `error.issues` in the body (not `error.errors`).
- [ ] **General Error Handling**: Wrap all route logic in a `try...catch` block. Return a generic `500 Internal Server Error` for unexpected errors.
- [ ] **Avoid `any`**: Do not use the `any` type. Use `unknown` for catch blocks or define explicit types.

### Database & Prisma
- [ ] **Use Singleton**: Always import the Prisma client from the shared module (`@/lib/prisma`).
- [ ] **Select Fields**: Only query the specific fields needed by using `select: { ... }`.
- [ ] **Transactions**: Use `prisma.$transaction([...])` for operations that involve multiple dependent database writes.

---

## 3. General Code Quality

### Readability & Maintainability
- [ ] **No Magic Strings/Numbers**: Abstract repeated literal values into constants (e.g., `MAX_RETRIES`, `DEFAULT_PAGE_SIZE`).
- [ ] **Clear Naming**: Use descriptive names for variables, functions, and components (e.g., `isSubmitting`, `fetchUserOrders` instead of `flag`, `getData`).
- [ ] **Function Length**: Keep functions short and focused on a single responsibility. Functions over ~50 lines are a candidate for refactoring.
- [ ] **Nesting Depth**: Avoid deep nesting (`if/for/try` blocks > 3 levels). Use early returns/guards to reduce nesting.
- [ ] **Parameter Objects**: Functions with more than 3 parameters should accept a single object parameter instead.
- [ ] **Comments**: Comment on the *why*, not the *what*. Explain complex logic, business rules, or workarounds.

### Code Duplication (DRY Principle)
- [ ] **Logic**: Abstract repeated business logic into shared utility functions in `src/lib/`.
- [ ] **Types**: Abstract repeated type definitions into shared files in `src/types/`.
- [ ] **React Logic**: Abstract repeated state management, side effects, or data fetching into custom hooks (e.g., `useApi`, `useDebounce`).

### Performance
- [ ] **Memoization**: Use `useMemo` for expensive calculations and `useCallback` for functions passed to memoized children to prevent unnecessary re-renders.
- [ ] **Dependency Arrays**: Ensure `useEffect`, `useMemo`, and `useCallback` dependency arrays are correct.
- [ ] **Efficient Loops**: Avoid nested loops that lead to O(n^2) complexity where a Map or other lookup could achieve O(n).
