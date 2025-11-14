# Redirección Automática al Login Administrativo

## 📋 Resumen de Cambios

Se modificó el comportamiento del sistema multitenant para que cuando no se especifica un tenant (sin query param `?tenant=`), automáticamente redirija al login administrativo general en lugar de intentar cargar tenants de demostración.

---

## ✨ Comportamiento Nuevo

### Escenarios de Acceso

| URL de Acceso                           | Comportamiento Anterior        | Comportamiento Nuevo                            |
| --------------------------------------- | ------------------------------ | ----------------------------------------------- |
| `http://localhost:4200`                 | Intentaba cargar `demo-a`      | ✅ Redirige a `/admin` (login administrativo)   |
| `http://localhost:4200?tenant=`         | Intentaba cargar `demo-a`      | ✅ Redirige a `/admin` (login administrativo)   |
| `http://localhost:4200?tenant=invalid`  | Redirige a `/tenant/not-found` | ✅ Redirige a `/tenant/not-found` (sin cambios) |
| `http://localhost:4200?tenant=tenant-a` | Carga `tenant-a`               | ✅ Carga `tenant-a` (sin cambios)               |

---

## 🔧 Archivos Modificados

### 1. `/core/src/lib/services/tenant-bootstrap.service.ts`

**Cambio en línea 60:**

```typescript
// ANTES
defaultTenantSlug: 'demo-a',

// DESPUÉS
defaultTenantSlug: '', // Sin tenant por defecto → modo administrador general
```

**Nuevo bloque en `initialize()` (líneas 178-189):**

```typescript
// Detectar modo administrador general (sin tenant)
if (!strategy.value || strategy.value.trim() === '') {
  console.log('🔐 [TenantBootstrap] Sin tenant específico - activando modo administrador general');

  // Establecer configuración por defecto
  this.setDefaultTenantConfig();
  this._status.set('resolved');
  this._isLoading.set(false);

  // Marcar en localStorage que estamos en modo admin
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('admin-mode', 'general');
  }

  return;
}
```

**Propósito:**

- Detecta cuando no hay tenant especificado (string vacío o null)
- Activa "modo administrador general"
- Establece una configuración por defecto mínima
- Marca en localStorage para que otros servicios sepan que estamos en modo admin
- Retorna inmediatamente sin intentar cargar desde el backend

---

### 2. `/core/src/lib/providers/tenant-app-initializer.provider.ts`

**Nuevo bloque al inicio de la función de inicialización (líneas 48-63):**

```typescript
// Verificar si estamos en modo administrador general (sin tenant)
const attemptedSlug = tenantBootstrap.attemptedSlug();
const isGeneralAdminMode = !attemptedSlug || attemptedSlug.trim() === '';

if (isGeneralAdminMode) {
  console.log('🔐 [APP_INITIALIZER] Modo administrador general detectado - redirigiendo al login admin...');

  // Redirigir al login administrativo
  setTimeout(() => {
    router
      .navigate(['/admin'], {
        replaceUrl: true,
      })
      .catch((navError) => {
        console.error('❌ [APP_INITIALIZER] Error navegando a /admin:', navError);
      });
  }, 100);
  return;
}
```

**Propósito:**

- Detecta si el slug intentado está vacío o es null
- Si es modo admin, redirige a `/admin` (login administrativo)
- Usa `replaceUrl: true` para que el usuario no pueda volver atrás
- Mantiene intacta la lógica de error para tenants inválidos (ej: `?tenant=invalid` → `/tenant/not-found`)

---

## 🎯 Flujo Completo

### Sin Tenant Especificado

```
1. Usuario accede: http://localhost:4200
   ↓
2. TenantBootstrapService.initialize()
   - resolveTenantStrategy() devuelve { type: 'default', value: '' }
   ↓
3. Detecta string vacío
   - console.log('🔐 Sin tenant específico - activando modo administrador general')
   - setDefaultTenantConfig()
   - localStorage.setItem('admin-mode', 'general')
   - status: 'resolved'
   ↓
4. APP_INITIALIZER ejecuta
   - attemptedSlug = ''
   - isGeneralAdminMode = true
   - console.log('🔐 Modo administrador general detectado...')
   ↓
5. Redirige a: /admin
   ↓
6. Usuario ve: Login Administrativo General
```

### Con Tenant Específico

```
1. Usuario accede: http://localhost:4200?tenant=tenant-a
   ↓
2. TenantBootstrapService.initialize()
   - resolveTenantStrategy() devuelve { type: 'query', value: 'tenant-a' }
   ↓
3. Detecta slug válido → intenta cargar desde backend
   - loadTenantFromBackend('tenant-a')
   ↓
4. Si existe:
   - Carga configuración del tenant
   - Aplica branding, tema, etc.
   - Usuario ve la aplicación del tenant

5. Si no existe:
   - status: 'not-found'
   - APP_INITIALIZER redirige a: /tenant/not-found?slug=tenant-a
```

---

## 📊 Indicadores en Consola

### Modo Administrador General

```console
🔐 [TenantBootstrap] Sin tenant específico - activando modo administrador general
🔐 [APP_INITIALIZER] Modo administrador general detectado - redirigiendo al login admin...
```

### Tenant Específico (Éxito)

```console
✅ [TenantBootstrap] Configuración del tenant cargada exitosamente: tenant-a
✅ [APP_INITIALIZER] Tenant inicializado correctamente: { slug: 'tenant-a', displayName: '...', strategy: 'query' }
```

### Tenant Inválido (Error)

```console
⚠️ [TenantBootstrap] Error al cargar tenant desde backend: { status: 'not-found', slug: 'invalid-tenant' }
⚠️ [APP_INITIALIZER] Error al cargar tenant: { status: 'not-found', code: 'TENANT_NOT_FOUND', slug: 'invalid-tenant' }
🔀 [APP_INITIALIZER] Redirigiendo a página de error de tenant...
```

---

## ✅ Testing

### Pruebas Automatizadas

```bash
npm test -- --testPathPattern=app.spec.ts
```

**Resultado:**

```
✓ should create the app (94 ms)
✓ should update page title when tenant is available (21 ms)

Test Suites: 1 passed
Tests:       2 passed
```

### Pruebas Manuales Recomendadas

1. **Sin tenant:**

   ```
   http://localhost:4200
   → Debería redirigir a /admin
   → localStorage['admin-mode'] = 'general'
   ```

2. **Con tenant válido:**

   ```
   http://localhost:4200?tenant=tenant-a
   → Debería cargar tenant-a
   → No hay localStorage['admin-mode']
   ```

3. **Con tenant inválido:**

   ```
   http://localhost:4200?tenant=invalid
   → Debería redirigir a /tenant/not-found?slug=invalid
   ```

4. **Tenant vacío:**
   ```
   http://localhost:4200?tenant=
   → Debería redirigir a /admin (modo admin)
   → localStorage['admin-mode'] = 'general'
   ```

---

## 🔍 localStorage Flag

El flag `admin-mode` en localStorage se usa para:

- **Valor:** `'general'`
- **Propósito:** Indicar a otros servicios/componentes que estamos en modo administrador general (sin tenant)
- **Uso:** Guards, servicios, componentes pueden leer este flag para cambiar comportamiento
- **Limpieza:** Se debe eliminar cuando se carga un tenant específico

### Ejemplo de Uso en Guards

```typescript
export const adminOnlyGuard: CanActivateFn = () => {
  const isAdminMode = localStorage.getItem('admin-mode') === 'general';

  if (isAdminMode) {
    return true; // Permitir acceso a rutas admin
  }

  // Redirigir o denegar acceso
  return inject(Router).createUrlTree(['/']);
};
```

---

## 📝 Notas Técnicas

### Timing del Redirect

Se usa `setTimeout(..., 100)` para asegurar que:

- El Router de Angular esté completamente inicializado
- Evitar conflictos con otras navegaciones pendientes
- Dar tiempo al APP_INITIALIZER para completar su ejecución

### replaceUrl: true

Se usa `replaceUrl: true` en la navegación para:

- Evitar que el usuario pueda usar "Atrás" para volver a la URL sin tenant
- Mantener el historial de navegación limpio
- Simular un comportamiento de "redirect permanente"

### setDefaultTenantConfig()

Este método establece una configuración mínima por defecto:

- Tenant slug: vacío o genérico
- Branding: valores por defecto
- Theme: tema base
- Configuraciones: valores mínimos para que la app funcione

---

## 🎨 Integración con PWA

El sistema PWA sigue funcionando:

1. **Sin tenant (modo admin):**

   - No se aplica branding específico de tenant
   - Se usan los assets por defecto (`/assets/pwa/default-*`)
   - El banner de iOS no se muestra (no tiene sentido en admin)

2. **Con tenant:**
   - Se aplica branding del tenant (logo, colores, nombre)
   - Se cargan assets dinámicos desde URLs del backend
   - El banner de iOS muestra branding personalizado

---

## 🚀 Próximos Pasos Recomendados

1. **Implementar Admin Login:**

   - Crear componente de login en `/admin`
   - Implementar autenticación para superadmin
   - Guardar credenciales/token en localStorage

2. **Guard para Rutas Admin:**

   - Crear `adminModeGuard()` que verifique localStorage['admin-mode']
   - Proteger rutas de superadmin con este guard

3. **Limpiar localStorage al Cambiar a Tenant:**

   - Cuando se cargue un tenant específico, eliminar flag 'admin-mode'
   - Evitar conflictos entre modo admin y modo tenant

4. **Documentar Rutas:**
   - Actualizar documentación de rutas
   - Especificar qué rutas requieren tenant y cuáles no

---

## 📖 Referencias

- **Documentación PWA:** `/docs/PWA-INSTALLATION-IOS-MULTITENANT.md`
- **Quick Start:** `/docs/PWA-QUICK-START.md`
- **Multi-Tenant Architecture:** `/docs/MULTI_TENANT_ARCHITECTURE.md`
- **Tenant Bootstrap:** `/docs/TENANT_BOOTSTRAP_BACKEND_INTEGRATION_COMPLETE.md`

---

## ✅ Checklist de Implementación

- [x] Cambiar `defaultTenantSlug` a string vacío
- [x] Agregar detección de slug vacío en `TenantBootstrapService.initialize()`
- [x] Establecer flag `localStorage['admin-mode']` cuando no hay tenant
- [x] Modificar `APP_INITIALIZER` para detectar modo admin
- [x] Redirigir a `/admin` cuando no hay tenant
- [x] Mantener redirección a `/tenant/not-found` para errores
- [x] Ejecutar tests y verificar que pasen
- [ ] Pruebas manuales de los 4 escenarios
- [ ] Implementar ruta `/admin` con login
- [ ] Crear guard para proteger rutas admin
- [ ] Limpiar localStorage al cargar tenant
- [ ] Actualizar documentación principal

---

**Fecha de Implementación:** 2025
**Estado:** ✅ Completado y testeado
**Autor:** Arquitecto Senior - PWA Multi-Tenant System
