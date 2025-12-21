# 📋 Plan de Mejora PWA-eCommerce

> **Fecha de creación:** 21 de diciembre de 2025  
> **Última actualización:** 21 de diciembre de 2025  
> **Estado general:** En progreso

---

## 📊 Resumen del Proyecto

| Métrica          | Valor                    |
| ---------------- | ------------------------ |
| Líneas de código | ~21,438 TypeScript       |
| Framework        | Angular 20 + Nx Monorepo |
| Arquitectura     | Multi-tenant PWA con SSR |
| Tests            | ✅ Pasando               |

---

## ✅ Módulos Completados

- [x] **Core Library** - API Client, Auth, Tenant Config, Theme, Guards, PWA
- [x] **Features Catalog** - Catálogo, búsqueda, filtros, paginación
- [x] **Features Account** - Login, Register, Profile, Forgot Password
- [x] **Shared Library** - Layouts, Header, Footer, Product Card, Skeletons
- [x] **Superadmin Base** - Shell, Dashboard, Menu, Guards, Permisos
- [x] **Tenants List** - Lista de tenants con filtros
- [x] **Tenant Create** - Formulario de creación de tenant

---

## 🚀 FASE 1: Flujo de Compra Básico

> **Prioridad:** 🔴 Alta  
> **Objetivo:** Tener un flujo de compra funcional end-to-end

### 1.1 CartService con Signals

- [ ] **Estado:** Pendiente
- **Archivo:** `features-cart/src/lib/services/cart.service.ts`
- **Descripción:** Servicio reactivo para gestión del carrito
- **Tareas:**
  - [ ] Crear modelo `CartItem` y `Cart`
  - [ ] Implementar signals para estado del carrito
  - [ ] Métodos: addItem, removeItem, updateQuantity, clear
  - [ ] Persistencia en localStorage por tenant
  - [ ] Cálculo automático de totales
- **Esfuerzo estimado:** 4 horas

### 1.2 CartPageComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-cart/src/lib/pages/cart-page.component.ts`
- **Descripción:** Página completa del carrito de compras
- **Tareas:**
  - [ ] Lista de productos en el carrito
  - [ ] Controles de cantidad (+/-)
  - [ ] Eliminar items
  - [ ] Resumen de totales
  - [ ] Botón "Proceder al checkout"
  - [ ] Estado vacío
- **Esfuerzo estimado:** 4 horas

### 1.3 CheckoutComponent Básico

- [ ] **Estado:** Pendiente
- **Archivo:** `features-checkout/src/lib/pages/checkout-page.component.ts`
- **Descripción:** Flujo de checkout paso a paso
- **Tareas:**
  - [ ] Paso 1: Datos de envío
  - [ ] Paso 2: Datos de facturación
  - [ ] Paso 3: Método de pago (mock)
  - [ ] Paso 4: Revisión y confirmación
  - [ ] Validación de formularios
  - [ ] CheckoutService para procesar orden
- **Esfuerzo estimado:** 6 horas

### 1.4 OrderConfirmationComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-checkout/src/lib/pages/order-confirmation.component.ts`
- **Descripción:** Página de confirmación post-compra
- **Tareas:**
  - [ ] Mostrar número de orden
  - [ ] Resumen de la compra
  - [ ] Datos de envío
  - [ ] Botones: Ver orden, Seguir comprando
- **Esfuerzo estimado:** 2 horas

### 1.5 OrdersListComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-orders/src/lib/pages/orders-list.component.ts`
- **Descripción:** Lista de órdenes del usuario
- **Tareas:**
  - [ ] OrdersService para obtener órdenes
  - [ ] Lista con paginación
  - [ ] Filtros por estado
  - [ ] Link a detalle de orden
- **Esfuerzo estimado:** 3 horas

### 1.6 OrderDetailComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-orders/src/lib/pages/order-detail.component.ts`
- **Descripción:** Detalle completo de una orden
- **Tareas:**
  - [ ] Información de la orden
  - [ ] Timeline de estados
  - [ ] Lista de productos
  - [ ] Datos de envío y facturación
- **Esfuerzo estimado:** 2 horas

---

## 🚀 FASE 2: Panel Superadmin Completo

> **Prioridad:** 🔴 Alta  
> **Objetivo:** Panel de administración funcional para gestión de tenants

### 2.1 TenantDetailComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-superadmin/src/lib/pages/tenant-detail/tenant-detail.component.ts`
- **Descripción:** Vista detallada de un tenant
- **Tareas:**
  - [ ] Información general del tenant
  - [ ] Estadísticas (usuarios, productos, órdenes)
  - [ ] Configuración actual
  - [ ] Historial de actividad
  - [ ] Acciones rápidas (suspender, activar, etc.)
- **Esfuerzo estimado:** 4 horas

### 2.2 TenantEditComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-superadmin/src/lib/pages/tenant-edit/tenant-edit.component.ts`
- **Descripción:** Formulario de edición de tenant
- **Tareas:**
  - [ ] Cargar datos existentes
  - [ ] Formulario reactivo con validaciones
  - [ ] Editar configuración, branding, features
  - [ ] Preview de cambios
  - [ ] Guardar cambios
- **Esfuerzo estimado:** 4 horas

### 2.3 UserListComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-superadmin/src/lib/pages/users-list/users-list.component.ts`
- **Descripción:** Lista de usuarios del sistema
- **Tareas:**
  - [ ] UserAdminService para CRUD
  - [ ] Tabla con búsqueda y filtros
  - [ ] Filtrar por rol, tenant, estado
  - [ ] Acciones: ver, editar, desactivar
  - [ ] Paginación
- **Esfuerzo estimado:** 4 horas

### 2.4 UserRolesComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-superadmin/src/lib/pages/user-roles/user-roles.component.ts`
- **Descripción:** Gestión de roles y permisos
- **Tareas:**
  - [ ] Lista de roles existentes
  - [ ] Crear/editar roles
  - [ ] Asignar permisos a roles
  - [ ] Vista de matriz de permisos
- **Esfuerzo estimado:** 3 horas

### 2.5 SystemLogsComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-superadmin/src/lib/pages/system-logs/system-logs.component.ts`
- **Descripción:** Visor de logs del sistema
- **Tareas:**
  - [ ] LogsService para obtener logs
  - [ ] Filtros por nivel, fecha, tenant
  - [ ] Vista en tiempo real (polling)
  - [ ] Exportar logs
- **Esfuerzo estimado:** 3 horas

### 2.6 FeatureFlagsComponent

- [ ] **Estado:** Pendiente
- **Archivo:** `features-superadmin/src/lib/pages/feature-flags/feature-flags.component.ts`
- **Descripción:** Gestión de feature flags globales
- **Tareas:**
  - [ ] Lista de flags existentes
  - [ ] Toggle on/off
  - [ ] Crear nuevos flags
  - [ ] Asignar flags por tenant o global
- **Esfuerzo estimado:** 3 horas

---

## 🚀 FASE 3: Admin de Tenant

> **Prioridad:** 🟡 Media  
> **Objetivo:** Panel para que cada tenant administre su negocio

### 3.1 Tenant Dashboard

- [ ] **Estado:** Pendiente
- **Archivo:** `features-admin/src/lib/pages/dashboard/tenant-dashboard.component.ts`
- **Descripción:** Dashboard con métricas del negocio
- **Tareas:**
  - [ ] Widgets de ventas del día/semana/mes
  - [ ] Órdenes pendientes
  - [ ] Productos más vendidos
  - [ ] Gráficos de tendencia
- **Esfuerzo estimado:** 6 horas

### 3.2 CRUD de Productos

- [ ] **Estado:** Pendiente
- **Archivos:**
  - `features-admin/src/lib/pages/products/products-list.component.ts`
  - `features-admin/src/lib/pages/products/product-form.component.ts`
- **Descripción:** Gestión completa de productos del tenant
- **Tareas:**
  - [ ] ProductAdminService
  - [ ] Lista con búsqueda y filtros
  - [ ] Formulario crear/editar producto
  - [ ] Upload de imágenes
  - [ ] Gestión de variantes
  - [ ] Control de stock
- **Esfuerzo estimado:** 8 horas

### 3.3 Gestión de Categorías

- [ ] **Estado:** Pendiente
- **Archivo:** `features-admin/src/lib/pages/categories/categories.component.ts`
- **Descripción:** CRUD de categorías
- **Tareas:**
  - [ ] CategoryAdminService
  - [ ] Vista árbol de categorías
  - [ ] Crear/editar/eliminar
  - [ ] Reordenar (drag & drop)
- **Esfuerzo estimado:** 4 horas

### 3.4 Configuración del Negocio

- [ ] **Estado:** Pendiente
- **Archivo:** `features-admin/src/lib/pages/settings/business-settings.component.ts`
- **Descripción:** Configuración general del tenant
- **Tareas:**
  - [ ] Datos del negocio
  - [ ] Logo y branding
  - [ ] Métodos de pago
  - [ ] Opciones de envío
  - [ ] Impuestos
- **Esfuerzo estimado:** 4 horas

### 3.5 Reportes de Ventas

- [ ] **Estado:** Pendiente
- **Archivo:** `features-admin/src/lib/pages/reports/sales-reports.component.ts`
- **Descripción:** Reportes y analytics de ventas
- **Tareas:**
  - [ ] Reporte por período
  - [ ] Ventas por producto/categoría
  - [ ] Exportar a CSV/Excel
  - [ ] Gráficos interactivos
- **Esfuerzo estimado:** 6 horas

---

## 🚀 FASE 4: Mejoras Técnicas

> **Prioridad:** 🟡 Media  
> **Objetivo:** Calidad de código, testing y estabilidad

### 4.1 Resolver Issue SSR (NG0201)

- [ ] **Estado:** Pendiente
- **Archivo:** `.github/workflows/ci.yml` y código relacionado
- **Descripción:** Arreglar el error que impide build SSR
- **Tareas:**
  - [ ] Investigar causa del NG0201
  - [ ] Aplicar fix
  - [ ] Reactivar build SSR en CI
- **Esfuerzo estimado:** 4 horas

### 4.2 Tests Unitarios

- [ ] **Estado:** Pendiente
- **Descripción:** Aumentar cobertura de tests
- **Tareas:**
  - [ ] Tests para CartService
  - [ ] Tests para CheckoutService
  - [ ] Tests para OrdersService
  - [ ] Tests para componentes nuevos
- **Esfuerzo estimado:** 6 horas

### 4.3 Tests E2E (Playwright)

- [ ] **Estado:** Pendiente
- **Archivo:** `apps/pwa-e2e/`
- **Descripción:** Tests end-to-end del flujo de compra
- **Tareas:**
  - [ ] Test: Agregar al carrito
  - [ ] Test: Checkout completo
  - [ ] Test: Login/Register
  - [ ] Test: Panel admin
- **Esfuerzo estimado:** 8 horas

### 4.4 Manejo de Errores Global

- [ ] **Estado:** Pendiente
- **Archivo:** `core/src/lib/errors/`
- **Descripción:** Mejorar el sistema de errores
- **Tareas:**
  - [ ] Error boundary global
  - [ ] Toasts de error consistentes
  - [ ] Logging de errores a servicio externo
  - [ ] Página de error genérica
- **Esfuerzo estimado:** 3 horas

### 4.5 Analytics/Tracking

- [ ] **Estado:** Pendiente
- **Archivo:** `core/src/lib/analytics/`
- **Descripción:** Implementar tracking de eventos
- **Tareas:**
  - [ ] AnalyticsService
  - [ ] Integración Google Analytics
  - [ ] Tracking de eventos de ecommerce
  - [ ] Configuración por tenant
- **Esfuerzo estimado:** 4 horas

---

## 🚀 FASE 5: Features Avanzados

> **Prioridad:** 🟢 Baja  
> **Objetivo:** Funcionalidades adicionales para completar el producto

### 5.1 Integración Pasarela de Pagos

- [ ] **Estado:** Pendiente
- **Descripción:** Integrar Stripe/PayPal
- **Tareas:**
  - [ ] PaymentService
  - [ ] Componente de tarjeta de crédito
  - [ ] Manejo de webhooks
  - [ ] Configuración por tenant
- **Esfuerzo estimado:** 8 horas

### 5.2 Sistema de Subscripciones

- [ ] **Estado:** Pendiente
- **Descripción:** Billing para planes de tenants
- **Tareas:**
  - [ ] SubscriptionService
  - [ ] Planes y precios
  - [ ] Facturación recurrente
  - [ ] Upgrades/downgrades
- **Esfuerzo estimado:** 8 horas

### 5.3 Analytics Dashboard

- [ ] **Estado:** Pendiente
- **Descripción:** Dashboard avanzado de analytics
- **Tareas:**
  - [ ] Gráficos interactivos
  - [ ] Métricas en tiempo real
  - [ ] Comparativas de períodos
  - [ ] Exportar reportes
- **Esfuerzo estimado:** 6 horas

### 5.4 Sistema de Notificaciones In-App

- [ ] **Estado:** Pendiente
- **Descripción:** Centro de notificaciones
- **Tareas:**
  - [ ] NotificationService
  - [ ] Bell icon con contador
  - [ ] Lista de notificaciones
  - [ ] Marcar como leído
- **Esfuerzo estimado:** 4 horas

### 5.5 Wishlist/Favoritos

- [ ] **Estado:** Pendiente
- **Descripción:** Lista de deseos del usuario
- **Tareas:**
  - [ ] WishlistService
  - [ ] Botón "Agregar a favoritos"
  - [ ] Página de wishlist
  - [ ] Persistencia por usuario
- **Esfuerzo estimado:** 3 horas

---

## 📝 Registro de Cambios

| Fecha      | Tarea                 | Estado |
| ---------- | --------------------- | ------ |
| 21/12/2025 | Creación del plan     | ✅     |
| 21/12/2025 | TenantsListComponent  | ✅     |
| 21/12/2025 | TenantCreateComponent | ✅     |
| 21/12/2025 | TenantAdminService    | ✅     |

---

## 🎯 Próxima Tarea Sugerida

**Tarea 1.1: CartService con Signals**

Para comenzar, ejecutar:

```bash
# Crear estructura de archivos para cart
mkdir -p features-cart/src/lib/services
mkdir -p features-cart/src/lib/models
mkdir -p features-cart/src/lib/pages
```

---

> **Nota:** Marca las tareas como completadas con `[x]` conforme avances.
