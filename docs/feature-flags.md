# Feature Flags

## Introducción

Los **feature flags** (también conocidos como feature toggles) son una técnica de desarrollo que permite activar o desactivar funcionalidades de la aplicación sin necesidad de cambiar el código o hacer un nuevo deployment. Esto facilita:

- Control fino sobre qué funcionalidades están activas en cada entorno
- Habilitar/deshabilitar features para testing
- Rollout progresivo de nuevas funcionalidades
- A/B testing y experimentación
- Desactivar features problemáticas sin hacer rollback

## Arquitectura

### Ubicación

Los feature flags están centralizados en un único archivo de configuración:

```
src/lib/featureFlags.ts
```

### Estructura

```typescript
export const featureFlags = {
  /**
   * Descripción clara de qué controla este flag
   */
  nombreDelFlag: process.env.NEXT_PUBLIC_NOMBRE_DEL_FLAG === 'true',
} as const;
```

### Principios de diseño

1. **Centralización**: Todos los flags están en un solo archivo para fácil mantenimiento
2. **Documentación**: Cada flag debe tener un comentario explicando su propósito
3. **Variables de entorno**: Los flags se controlan mediante variables de entorno
4. **Prefijo NEXT_PUBLIC_**: Necesario para que Next.js pueda acceder a la variable en el cliente
5. **Tipo inmutable**: El uso de `as const` asegura que TypeScript trate el objeto como readonly

## Cómo crear un nuevo feature flag

### Paso 1: Agregar el flag a featureFlags.ts

Edita `src/lib/featureFlags.ts` y agrega tu nuevo flag:

```typescript
export const featureFlags = {
  // ... flags existentes ...

  /**
   * Habilita la nueva funcionalidad X
   * Cuando está deshabilitado, se usa el comportamiento legacy
   */
  enableNuevaFuncionalidadX: process.env.NEXT_PUBLIC_ENABLE_NUEVA_FUNCIONALIDAD_X === 'true',
} as const;
```

### Paso 2: Agregar la variable de entorno

Agrega la variable de entorno en tu archivo `.env` (y `.env.example` para documentación):

```bash
# Feature Flags

# Habilita la nueva funcionalidad X (true/false)
NEXT_PUBLIC_ENABLE_NUEVA_FUNCIONALIDAD_X="true"
```

**Importante**: Recuerda agregar también la variable en:
- `.env.example` - Para documentar el flag
- Variables de entorno de producción (Vercel, Railway, etc.)
- Variables de entorno de staging/desarrollo si aplica

### Paso 3: Usar el flag en tu código

Importa el objeto `featureFlags` y usa tu flag:

```typescript
import { featureFlags } from '@/lib/featureFlags';

export function MiComponente() {
  return (
    <div>
      {featureFlags.enableNuevaFuncionalidadX ? (
        <NuevaFuncionalidad />
      ) : (
        <FuncionalidadLegacy />
      )}
    </div>
  );
}
```

O para mostrar/ocultar elementos condicionalmente:

```typescript
{featureFlags.enableNuevaFuncionalidadX && (
  <Button onClick={handleNuevaAccion}>
    Nueva Acción
  </Button>
)}
```

### Paso 4: Reiniciar el servidor de desarrollo

Después de agregar o modificar variables de entorno, debes reiniciar el servidor:

```bash
# Detener el servidor (Ctrl+C)
# Luego volver a iniciar:
npm run dev
```

## Ejemplo completo

Aquí está un ejemplo completo de cómo se implementó el feature flag para crear clínicas en el formulario de usuario:

### 1. Definición del flag (src/lib/featureFlags.ts)

```typescript
export const featureFlags = {
  /**
   * Enable the "Create Clinic" button in the user form
   * When disabled, users can only select existing clinics
   */
  enableCreateClinicInUserForm: process.env.NEXT_PUBLIC_ENABLE_CREATE_CLINIC_IN_USER_FORM === 'true',
} as const;
```

### 2. Variable de entorno (.env)

```bash
# Enable the "Create Clinic" button in the user form (true/false)
NEXT_PUBLIC_ENABLE_CREATE_CLINIC_IN_USER_FORM="true"
```

### 3. Uso en el componente (UserForm.tsx)

```typescript
import { featureFlags } from '@/lib/featureFlags';

export function UserForm() {
  // ... resto del código ...

  return (
    <form>
      {/* ... otros campos ... */}

      {featureFlags.enableCreateClinicInUserForm && (
        <Button
          type="button"
          variant="primary"
          onClick={() => setIsCreateClinicModalOpen(true)}
        >
          Crear Clínica
        </Button>
      )}
    </form>
  );
}
```

## Mejores prácticas

### ✅ DO (Hacer)

- **Usar nombres descriptivos**: `enableCreateClinicInUserForm` en lugar de `flag1`
- **Documentar cada flag**: Explicar qué controla y qué pasa cuando está deshabilitado
- **Limpiar flags obsoletos**: Eliminar flags cuando la feature está completamente implementada y estable
- **Valores por defecto seguros**: Si la variable no está definida, debería ser `false` (comportamiento conservador)
- **Usar en componentes**: Principalmente para UI condicional en el cliente

### ❌ DON'T (Evitar)

- **No crear flags sin documentación**: Siempre documenta el propósito
- **No usar flags para configuración**: Para configuración usa variables de entorno directamente
- **No crear demasiados flags**: Revisa y limpia flags periódicamente
- **No usar flags para lógica crítica de negocio**: Los flags son para features en desarrollo/testing, no para lógica core

## Ciclo de vida de un feature flag

1. **Desarrollo**: Se crea el flag para desarrollar la feature de forma incremental
2. **Testing**: El flag permite activar/desactivar la feature para pruebas
3. **Staging**: Se prueba en un entorno similar a producción
4. **Canary/Rollout**: Se activa gradualmente en producción
5. **Estable**: Cuando la feature es estable, se puede considerar eliminar el flag
6. **Limpieza**: Eliminar el flag y dejar solo el código de la feature

## Troubleshooting

### El flag no funciona después de cambiar el .env

**Solución**: Reinicia el servidor de desarrollo. Las variables de entorno solo se leen al iniciar.

### El flag siempre es false en el cliente

**Solución**: Verifica que la variable tenga el prefijo `NEXT_PUBLIC_`. Sin este prefijo, Next.js no la expone al cliente.

### TypeScript no autocompleta el flag

**Solución**: Asegúrate de que el archivo `featureFlags.ts` use `export const` y `as const` para que TypeScript infiera correctamente los tipos.

## Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)
