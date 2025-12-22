# 🔐 Guía de Integración: Sistema de Login con Tenant y Menú Dinámico

## 📋 Resumen de Cambios Realizados

Se actualizó el sistema de autenticación para soportar la estructura de respuesta del backend Azure con:

1. ✅ Permisos estructurados por módulo con acciones granulares
2. ✅ Distinción entre `tenant_user` y `customer`
3. ✅ Menú administrativo dinámico basado en permisos
4. ✅ Headers `X-Tenant-Slug` automáticos en todas las peticiones

---

## 🎯 Estructura de Respuesta del Backend (Actualizada)

### **Login con Tenant (Admin/Manager)**

**Request:**

```http
POST /auth/login
X-Tenant-Slug: test-tenant-1
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-22T10:30:00Z",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@test.com",
    "userType": "tenant_user",
    "roles": ["Admin", "Manager"],
    "permissions": [
      {
        "moduleCode": "PRODUCTS",
        "moduleName": "Products Management",
        "iconName": "box",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true
      },
      {
        "moduleCode": "ORDERS",
        "moduleName": "Orders Management",
        "iconName": "shopping-cart",
        "canView": true,
        "canCreate": false,
        "canUpdate": true,
        "canDelete": false
      }
    ],
    "isActive": true,
    "mustChangePassword": false
  }
}
```

### **Login de Cliente**

**Request:**

```http
POST /auth/login
X-Tenant-Slug: test-tenant-1
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-22T10:30:00Z",
  "user": {
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "email": "cliente@example.com",
    "userType": "customer",
    "firstName": "Juan",
    "lastName": "Pérez",
    "roles": [],
    "permissions": [],
    "isActive": true
  }
}
```

---

## 🔄 Cómo Funciona el Login con Tenant

### **1. El Header `X-Tenant-Slug` se añade automáticamente**

El `authTenantInterceptor` detecta si hay un tenant activo y añade el header:

**Archivo:** `core/src/lib/http/auth-tenant.interceptor.ts`

```typescript
export const authTenantInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tenant = inject(TenantConfigService).tenantSlug; // ← Detecta el tenant
  const env = inject<AppEnv>(APP_ENV);

  let headers = req.headers;
  if (auth.token) headers = headers.set('Authorization', `Bearer ${auth.token}`);
  if (env.useTenantHeader && tenant) headers = headers.set('X-Tenant-Slug', tenant); // ← Header automático

  return next(req.clone({ headers }));
};
```

### **2. El AuthService selecciona el endpoint correcto**

**Archivo:** `core/src/lib/auth/auth.service.ts`

```typescript
async login(credentials: {
  email: string;
  password: string;
}): Promise<void> {
  const hasTenant = this._tenantSlug !== null;

  // Si hay tenant → /auth/login
  // Si NO hay tenant → /admin/auth/login (SuperAdmin)
  const endpoint = hasTenant ? '/auth/login' : '/admin/auth/login';

  const response = await this.apiClient.post<AuthResponse>(endpoint, {
    email: credentials.email,
    password: credentials.password,
  });

  this.setToken(response.token);
}
```

### **3. El sistema decodifica el JWT y extrae los permisos**

```typescript
setToken(token: string) {
  this._jwt.set(token);

  const base64 = token.split('.')[1];
  const json = globalThis.atob(base64);
  const claims = JSON.parse(json);

  this._claims.set(claims); // ← Claims incluyen modulePermissions
}
```

---

## 🎨 Construcción del Menú Administrativo

### **Servicio: TenantAdminMenuService**

**Ubicación:** `core/src/lib/services/tenant-admin-menu.service.ts`

Este servicio:

- ✅ Convierte los `ModulePermission` del backend en items de menú
- ✅ Filtra automáticamente módulos según `canView`
- ✅ Agrupa módulos bajo "Configuración" si es necesario
- ✅ Proporciona métodos para verificar permisos de acciones

**Uso básico:**

```typescript
import { TenantAdminMenuService } from '@pwa/core';

export class MyComponent {
  private readonly menuService = inject(TenantAdminMenuService);

  // Obtener el menú completo
  readonly menu = computed(() => this.menuService.menu());

  // Verificar permisos de acciones
  canCreateProduct = this.menuService.canPerformAction('PRODUCTS', 'create');
  canDeleteOrder = this.menuService.canPerformAction('ORDERS', 'delete');

  // Verificar tipo de usuario
  isAdmin = this.menuService.isTenantAdmin();
  isCustomer = this.menuService.isCustomer();
}
```

### **Mapeo de Módulos del Backend**

El servicio incluye un mapeo configurable de códigos de módulo a configuración de menú:

```typescript
private readonly moduleConfigMap: Record<string, MenuModuleConfig> = {
  PRODUCTS: {
    label: 'Productos',
    icon: 'inventory_2',
    route: '/admin/products',
    order: 2,
    parentModule: 'CONFIG', // Se agrupa bajo "Configuración"
  },
  CATEGORIES: {
    label: 'Categorías',
    icon: 'category',
    route: '/admin/categories',
    order: 1,
    parentModule: 'CONFIG',
  },
  BANNERS: {
    label: 'Banners',
    icon: 'image',
    route: '/admin/banners',
    order: 3,
    parentModule: 'CONFIG',
  },
  ORDERS: {
    label: 'Ventas',
    icon: 'shopping_cart',
    route: '/admin/orders',
    order: 4,
  },
  // ... más módulos
};
```

**⚠️ IMPORTANTE:** Ajusta este mapeo según los módulos que tu backend envíe.

---

## 🧩 Componente del Menú

**Ubicación:** `shared/src/lib/components/tenant-admin-menu/tenant-admin-menu.component.ts`

### **Uso en tu Layout Administrativo:**

```typescript
import { TenantAdminMenuComponent } from '@pwa/shared';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [TenantAdminMenuComponent, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Menú lateral -->
      <app-tenant-admin-menu></app-tenant-admin-menu>

      <!-- Contenido principal -->
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
```

---

## 🔐 Guards para Rutas Administrativas

### **1. Guard de Autenticación (ya existe)**

```typescript
import { authGuard } from '@pwa/core';

{
  path: 'admin',
  canActivate: [authGuard], // ← Verifica que esté autenticado
  children: [
    { path: 'products', component: ProductsComponent },
    { path: 'categories', component: CategoriesComponent },
  ]
}
```

### **2. Crear Guard Personalizado para Verificar Permisos de Módulo**

**Archivo:** `core/src/lib/auth/guards/module-permission.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantAdminMenuService } from '../../services/tenant-admin-menu.service';

export function modulePermissionGuard(moduleCode: string, action: 'view' | 'create' | 'update' | 'delete' = 'view'): CanActivateFn {
  return () => {
    const menuService = inject(TenantAdminMenuService);
    const router = inject(Router);

    const hasPermission = menuService.canPerformAction(moduleCode, action);

    if (!hasPermission) {
      console.warn(`[ModulePermissionGuard] Sin permiso: ${moduleCode}:${action}`);
      router.navigate(['/access-denied']);
      return false;
    }

    return true;
  };
}
```

**Uso en rutas:**

```typescript
import { modulePermissionGuard } from '@pwa/core';

{
  path: 'admin/products',
  component: ProductsComponent,
  canActivate: [
    authGuard,
    modulePermissionGuard('PRODUCTS', 'view')
  ]
},
{
  path: 'admin/products/create',
  component: ProductCreateComponent,
  canActivate: [
    authGuard,
    modulePermissionGuard('PRODUCTS', 'create')
  ]
}
```

---

## 📊 Ejemplo de Menú Generado

Dado estos permisos del backend:

```json
{
  "permissions": [
    {
      "moduleCode": "CATEGORIES",
      "moduleName": "Categorías",
      "iconName": "category",
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": false
    },
    {
      "moduleCode": "PRODUCTS",
      "moduleName": "Productos",
      "iconName": "inventory_2",
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    },
    {
      "moduleCode": "BANNERS",
      "moduleName": "Banners",
      "iconName": "image",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "moduleCode": "ORDERS",
      "moduleName": "Ventas",
      "iconName": "shopping_cart",
      "canView": true,
      "canCreate": false,
      "canUpdate": true,
      "canDelete": false
    }
  ]
}
```

**El menú generado será:**

```
📋 Configuración
   ├─ 📂 Categorías
   ├─ 📦 Productos
   └─ 🖼️  Banners

🛒 Ventas
```

---

## 🚀 Pasos para Integrar con Tu Backend

### **1. Asegúrate de que tu backend envía la respuesta correcta**

El backend debe enviar en la respuesta de login:

```json
{
  "token": "...",
  "expiresAt": "...",
  "user": {
    "userId": "...",
    "email": "...",
    "userType": "tenant_user" | "customer",
    "roles": ["Admin", "Manager"],
    "permissions": [
      {
        "moduleCode": "PRODUCTS",
        "moduleName": "Productos",
        "iconName": "box",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true
      }
    ],
    "isActive": true
  }
}
```

### **2. Incluye los permisos en el JWT**

El token JWT debe incluir:

```json
{
  "sub": "user-id",
  "email": "admin@test.com",
  "userType": "tenant_user",
  "roles": ["Admin"],
  "modulePermissions": [
    {
      "moduleCode": "PRODUCTS",
      "moduleName": "Productos",
      "iconName": "box",
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    }
  ],
  "exp": 1735689600,
  "iat": 1735603200
}
```

### **3. Configura los módulos en `moduleConfigMap`**

Edita: `core/src/lib/services/tenant-admin-menu.service.ts`

Añade todos los módulos que tu backend puede enviar:

```typescript
private readonly moduleConfigMap: Record<string, MenuModuleConfig> = {
  PRODUCTS: {
    label: 'Productos',
    icon: 'inventory_2',
    route: '/admin/products',
    order: 2,
    parentModule: 'CONFIG',
  },
  // ← Añade más módulos aquí
  ORDERS: {
    label: 'Ventas',
    icon: 'shopping_cart',
    route: '/admin/orders',
    order: 4,
  },
  METRICS: {
    label: 'Métricas',
    icon: 'analytics',
    route: '/admin/metrics',
    order: 5,
  },
};
```

### **4. Usa el componente del menú**

En tu layout administrativo:

```typescript
import { TenantAdminMenuComponent } from '@pwa/shared';

@Component({
  template: `
    <div class="layout">
      <app-tenant-admin-menu></app-tenant-admin-menu>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  imports: [TenantAdminMenuComponent, RouterModule],
})
export class AdminLayoutComponent {}
```

### **5. Protege las rutas con guards**

```typescript
{
  path: 'admin',
  canActivate: [authGuard],
  children: [
    {
      path: 'products',
      component: ProductsComponent,
      canActivate: [modulePermissionGuard('PRODUCTS', 'view')]
    },
    {
      path: 'products/create',
      component: ProductCreateComponent,
      canActivate: [modulePermissionGuard('PRODUCTS', 'create')]
    }
  ]
}
```

---

## 🎭 Diferenciar Usuario Admin vs Cliente

### **En Templates:**

```html
@if (menuService.isTenantAdmin()) {
<!-- Mostrar menú administrativo -->
<app-tenant-admin-menu></app-tenant-admin-menu>
} @else if (menuService.isCustomer()) {
<!-- Mostrar menú de cliente -->
<app-customer-menu></app-customer-menu>
}
```

### **En Componentes:**

```typescript
import { TenantAdminMenuService } from '@pwa/core';

export class MyComponent {
  private readonly menuService = inject(TenantAdminMenuService);

  readonly isAdmin = computed(() => this.menuService.isTenantAdmin());
  readonly isCustomer = computed(() => this.menuService.isCustomer());
}
```

### **En Guards:**

```typescript
export const customerGuard: CanActivateFn = () => {
  const menuService = inject(TenantAdminMenuService);
  const router = inject(Router);

  if (!menuService.isCustomer()) {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};
```

---

## 📝 Checklist de Integración

- [ ] **Backend envía la estructura correcta** con `userId`, `userType`, `permissions`
- [ ] **JWT incluye `modulePermissions`** en el payload
- [ ] **Configurar `moduleConfigMap`** con todos tus módulos
- [ ] **Usar `TenantAdminMenuComponent`** en el layout administrativo
- [ ] **Crear guards** para proteger rutas con permisos
- [ ] **Diferenciar interfaz** entre admin y cliente usando `isTenantAdmin()` / `isCustomer()`
- [ ] **Probar login** con diferentes usuarios y verificar el menú generado

---

## 🐛 Debugging

### **Ver permisos del usuario actual:**

```typescript
import { AuthService } from '@pwa/core';

export class DebugComponent {
  private readonly auth = inject(AuthService);

  ngOnInit() {
    console.log('Claims:', this.auth.claims);
    console.log('User Type:', this.auth.claims?.userType);
    console.log('Roles:', this.auth.claims?.roles);
    console.log('Module Permissions:', this.auth.claims?.modulePermissions);
  }
}
```

### **Ver menú generado:**

```typescript
import { TenantAdminMenuService } from '@pwa/core';

export class DebugComponent {
  private readonly menuService = inject(TenantAdminMenuService);

  ngOnInit() {
    console.log('Generated Menu:', this.menuService.menu());
  }
}
```

---

## 📞 Soporte

Si necesitas:

- Añadir más módulos
- Cambiar la estructura del menú
- Implementar permisos más complejos

Edita estos archivos:

1. `core/src/lib/services/tenant-admin-menu.service.ts` - Lógica del menú
2. `shared/src/lib/components/tenant-admin-menu/tenant-admin-menu.component.ts` - UI del menú
3. `core/src/lib/auth/guards/module-permission.guard.ts` - Guards personalizados
