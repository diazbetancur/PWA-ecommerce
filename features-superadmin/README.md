# Features Superadmin

Módulo de administración general para gestionar todos los tenants de la plataforma.

## 🎯 Propósito

Este módulo proporciona un panel de administración centralizado para:

- Gestionar todos los tenants de la plataforma
- Administrar usuarios globales
- Configurar subscripciones y planes
- Ver analytics y reportes globales
- Configurar el sistema completo

**Diferencia con `features-admin`**: Este módulo es para el **administrador de la plataforma completa** (superadmin), mientras que `features-admin` es para administradores de tenants específicos.

## 📦 Contenido

```
features-superadmin/
├── models/              # Modelos de datos (menú, permisos, auth)
├── config/              # Configuración del tenant general
├── services/            # AdminMenuService (menú dinámico)
├── guards/              # adminPermissionGuard (seguridad)
├── components/          # AdminShellComponent (layout + sidebar)
└── pages/               # Páginas del admin (placeholders)
```

## 🚀 Uso Rápido

### 1. Integrar en app.routes.ts

```typescript
import { ADMIN_ROUTES } from '@pwa/features-superadmin';

export const appRoutes: Route[] = [
  // ... otras rutas
  {
    path: 'admin',
    loadChildren: () => import('@pwa/features-superadmin').then((m) => m.ADMIN_ROUTES),
  },
];
```

### 2. Login como SuperAdmin

El usuario debe autenticarse SIN especificar un tenant. El backend responde con un JWT que incluye:

```json
{
  "isSuperAdmin": true,
  "roles": ["SUPER_ADMIN"],
  "permissions": ["*"]
}
```

### 3. Navegar al Admin

Una vez autenticado, acceder a `/admin`. El sistema:

1. Verifica autenticación con `adminAuthGuard`
2. Configura el contexto como "general-admin"
3. Filtra el menú según permisos del usuario
4. Muestra el dashboard

## 🔐 Seguridad

### Guards Disponibles

```typescript
// Solo autenticación y contexto
canActivate: [adminAuthGuard]

// Autenticación + permisos específicos
canActivate: [adminPermissionGuard]
data: {
  requiredPermissions: ['tenants:create'],
  requiredRoles: ['SUPER_ADMIN'],
  permissionMode: 'all' // o 'any'
}

// Helpers inline
canActivate: [withPermissions(['tenants:create'])]
canActivate: [withRoles(['SUPER_ADMIN'])]
```

### Permisos del Sistema

```typescript
import { ADMIN_PERMISSIONS } from '@pwa/features-superadmin';

// Ejemplos:
ADMIN_PERMISSIONS.TENANTS.VIEW; // 'tenants:view'
ADMIN_PERMISSIONS.TENANTS.CREATE; // 'tenants:create'
ADMIN_PERMISSIONS.USERS.MANAGE_ROLES; // 'users:manage-roles'
```

## 🎨 Personalización del Menú

Editar `services/admin-menu.service.ts`:

```typescript
private readonly baseMenuItems: AdminMenuItem[] = [
  {
    id: 'my-section',
    label: 'Mi Sección',
    icon: 'star', // Material Icon
    route: '/admin/my-section',
    order: 10,
    requiredPermissions: ['my-section:view'],
    badge: {
      text: 'NEW',
      color: 'accent',
    },
  },
];
```

## 📡 Comunicación con el Backend

### Headers HTTP

En modo admin general, el interceptor NO envía `X-Tenant-Slug`, pero sí envía:

```http
X-Admin-Mode: general
Authorization: Bearer <token>
```

### Endpoints Esperados

```
GET    /api/admin/tenants           - Lista todos los tenants
POST   /api/admin/tenants           - Crea nuevo tenant
GET    /api/admin/tenants/:id       - Detalle de tenant
PUT    /api/admin/tenants/:id       - Actualiza tenant
DELETE /api/admin/tenants/:id       - Elimina tenant
GET    /api/admin/users             - Lista usuarios globales
GET    /api/admin/subscriptions     - Ver subscripciones
GET    /api/admin/analytics         - Dashboard de analytics
```

## 📚 Documentación Completa

Ver [SUPERADMIN_MODULE_ARCHITECTURE.md](/docs/SUPERADMIN_MODULE_ARCHITECTURE.md) para:

- Diagramas de arquitectura
- Flujos detallados
- Decisiones de diseño
- Guías avanzadas

## Running unit tests

Run `nx test features-superadmin` to execute the unit tests.
