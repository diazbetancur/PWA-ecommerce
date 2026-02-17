# 🔐 Feature: Accesibilidad (RBAC - Roles y Permisos)

## 📋 Resumen

Feature completo de gestión de Roles y Permisos (RBAC - Role-Based Access Control) para el panel de administración. Permite crear roles personalizados y gestionar permisos por módulo de forma granular.

## 🏗️ Arquitectura

### Estructura de Archivos

```
features-admin/src/lib/
├── models/
│   └── rbac.model.ts                          # DTOs y modelos
├── services/
│   ├── role.service.ts                        # CRUD de roles
│   └── permission.service.ts                  # Gestión de permisos
├── components/
│   └── role-dialog/                           # Dialog crear/editar rol
│       ├── role-dialog.component.ts
│       ├── role-dialog.component.html
│       └── role-dialog.component.scss
└── pages/
    └── access/
        ├── roles-list/                        # Lista de roles (CRUD)
        │   ├── roles-list.component.ts
        │   ├── roles-list.component.html
        │   └── roles-list.component.scss
        └── role-permissions/                  # Matriz de permisos
            ├── role-permissions.component.ts
            ├── role-permissions.component.html
            └── role-permissions.component.scss
```

### Rutas Configuradas

```typescript
/admin/access
  ├── /admin/access/roles                      → RolesListComponent
  └── /admin/access/roles/:roleId/permissions  → RolePermissionsComponent
```

## 🔌 Integración con la Arquitectura Existente

### ✅ Servicios HTTP

- **Usa `ApiClientService`** del core (NO reinventa el wrapper HTTP)
- Headers automáticos: `X-Tenant-Slug`, `Authorization Bearer token`
- Interceptores ya configurados: `TenantHeaderInterceptor`

### ✅ Componentes Compartidos Reutilizados

- `ConfirmationDialogComponent` (de @pwa/shared)
- Angular Material (MatDialog, MatTable, MatCheckbox, etc.)
- Patrones de signals + RxJS consistentes con el proyecto

### ✅ Guards

- Usa `modulePermissionGuard('permissions')` existente
- Las rutas ya están protegidas correctamente

## 📡 Endpoints Backend

### RoleService (`/admin/roles`)

```typescript
GET    /admin/roles                      → Listar todos los roles
GET    /admin/roles/{id}                 → Detalle de un rol
POST   /admin/roles                      → Crear rol
PUT    /admin/roles/{id}                 → Actualizar rol
DELETE /admin/roles/{id}                 → Eliminar rol (409 si tiene usuarios)
```

### PermissionService

```typescript
GET /admin/roles/available-modules       → Módulos disponibles en el sistema
GET /admin/roles/{id}/permissions        → Permisos actuales del rol
PUT /admin/roles/{id}/permissions        → Actualizar permisos del rol
```

## 🎨 UX/UI Features

### Pantalla: Roles (Lista)

- ✅ Tabla con Angular Material
- ✅ Columnas: Nombre, Descripción, Tipo (Sistema/Personalizado), Usuarios asignados
- ✅ Acciones: Permisos, Editar, Eliminar
- ✅ Loading/Error/Empty states
- ✅ Protección: Roles del sistema NO se pueden editar/eliminar
- ✅ Dialog de confirmación al eliminar
- ✅ Manejo de errores 409 (Conflict) para roles con usuarios

### Pantalla: Permisos por Rol (Matriz)

- ✅ Grid interactivo: Módulos (filas) × Permisos (columnas)
- ✅ Checkboxes: View, Create, Update, Delete
- ✅ Respeta `availablePermissions` por módulo
- ✅ Acciones rápidas por fila: "Todo", "Solo lectura", "Limpiar"
- ✅ Acciones globales: "Seleccionar todo", "Limpiar todo"
- ✅ **Dirty state detection**: Solo habilita "Guardar" si hay cambios
- ✅ Confirmación al salir con cambios sin guardar
- ✅ Carga en paralelo (módulos + permisos actuales) con `forkJoin`

### Dialog: Crear/Editar Rol

- ✅ Formulario reactivo con validación
- ✅ Campos: Nombre (3-50 chars), Descripción (max 200 chars)
- ✅ Hint para roles del sistema: nombre deshabilitado
- ✅ Manejo de error 409 (nombre duplicado)
- ✅ Loading spinner durante guardado

## 🔗 Integración al Menú Dinámico

### ⚠️ ACCIÓN REQUERIDA

El menú dinámico del admin se genera desde el backend. Para integrar este feature:

#### Opción 1: Cambio en Backend (Recomendado)

Actualizar el módulo `permissions` en el backend para que retorne:

```json
{
  "code": "permissions",
  "name": "Accesibilidad",        ← Cambiar "Permisos" → "Accesibilidad"
  "icon": "shield",                ← Cambiar icono si es necesario
  "path": "/admin/access",         ← Cambiar ruta de /admin/permissions
  "isActive": true
}
```

#### Opción 2: Override en Frontend (Temporal)

Si no puedes cambiar el backend inmediatamente, puedes hacer un override en el componente que renderiza el menú:

```typescript
// Ejemplo: donde se procesa el menú dinámico
menuItems = menuItems.map(item => {
  if (item.code === 'permissions') {
    return {
      ...item,
      name: 'Accesibilidad',
      path: '/admin/access',
      icon: 'shield'
    };
  }
  return item;
});
```

### Ruta Anterior vs Nueva

```diff
- /admin/permissions   (placeholder vacío)
+ /admin/access        (feature completo)
  ├── /admin/access/roles
  └── /admin/access/roles/:roleId/permissions
```

## 📦 DTOs y Modelos

Todos los DTOs están en `rbac.model.ts` y coinciden exactamente con los contratos del backend:

- `RolesResponse`, `RoleSummaryDto`, `RoleDetailDto`
- `CreateRoleRequest`, `UpdateRoleRequest`
- `AvailableModulesResponse`, `ModuleDto`
- `RolePermissionsResponse`, `ModulePermissionDto`
- `UpdateRolePermissionsRequest`

## 🧪 Testing Checklist

### Roles - CRUD

- [ ] Crear rol con nombre válido
- [ ] Error 409 al crear rol con nombre duplicado
- [ ] Editar rol personalizado
- [ ] NO permitir editar nombre de rol del sistema
- [ ] Eliminar rol sin usuarios
- [ ] Error 409 al eliminar rol con usuarios asignados
- [ ] NO permitir eliminar rol del sistema (botón disabled)

### Permisos - Matriz

- [ ] Cargar módulos activos y permisos actuales
- [ ] Marcar/desmarcar checkboxes individuales
- [ ] Acción rápida "Todo" en una fila
- [ ] Acción rápida "Solo lectura" en una fila
- [ ] Acción rápida "Limpiar" en una fila
- [ ] Acción global "Seleccionar todo"
- [ ] Acción global "Limpiar todo"
- [ ] Detectar cambios (isDirty)
- [ ] Guardar solo módulos con al menos un permiso
- [ ] Confirmación al salir con cambios sin guardar

## 🚀 Próximos Pasos (Opcionales)

1. **Toast notifications**: Integrar `ToastService` para mostrar mensajes de éxito/error (actualmente solo console.log)
2. **Búsqueda/Filtros**: Agregar búsqueda en lista de roles
3. **Paginación**: Si la lista de roles crece mucho
4. **Audit log**: Track de cambios en roles/permisos
5. **Bulk operations**: Asignar rol a múltiples usuarios

## 📝 Notas Técnicas

- **Signals + RxJS**: Usa el patrón híbrido consistente con el resto del proyecto
- **Standalone Components**: Todos los componentes son standalone
- **Lazy Loading**: Rutas con lazy loading para optimizar bundle size
- **Tipado estricto**: Sin uso de `any` (excepto error handlers específicos)
- **Material Design**: UI consistente con el resto del admin panel
- **Responsive**: Mobile-first con breakpoints apropiados

## ✨ Features Destacados

1. **Detección inteligente de cambios**: No permite guardar si no hay cambios reales
2. **Protección de roles del sistema**: UI disable + backend validation
3. **Carga paralela optimizada**: `forkJoin` para módulos + permisos
4. **Error handling robusto**: Manejo específico de 409, 400, etc.
5. **UX pulida**: Loading states, empty states, confirmaciones, tooltips

---

**Autor**: Senior Angular Engineer  
**Fecha**: 2026-02-13  
**Base URL API**: `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net`
