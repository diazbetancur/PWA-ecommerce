# 📊 Estado Actual del Proyecto - PWA eCommerce Multitenant

**Fecha:** 20 de enero de 2026  
**Branch:** main  
**Última actualización:** Post-implementación de stock multi-tienda

---

## ✅ Sistemas Implementados

### 1. Multitenancy

**Estado:** ✅ Funcional

**Estrategia de resolución:**

1. Query param `?tenant=xxx` (prioridad 1)
2. Subdomain (prioridad 2)
3. Hostname mapping (prioridad 3)
4. Default/fallback (prioridad 4)

**Propagación:**

```
TenantBootstrapService (APP_INITIALIZER)
  ↓ Detecta tenant via query/subdomain
  ↓ GET /api/public/tenant/:slug
  ↓ Aplica theme/manifest/favicon
  ↓
TenantContextService
  ↓ Signals: tenantSlug(), tenantKey()
  ↓
TenantHeaderInterceptor
  ↓ Headers: X-Tenant-Slug, X-Tenant-Key
```

**Tenant activo en backend:** `test`  
**Features habilitados:**

- ✅ Cart, Wishlist, Loyalty, Notifications
- ❌ Reviews

---

### 2. Stock Multi-Tienda

**Estado:** ✅ Implementado (commit `ac1197d`)

**Funcionalidades:**

- ✅ Distribución de stock en creación de producto
- ✅ Validación: stock distribuido ≤ stock total
- ✅ Vista de stock por tiendas
- ✅ Actualización inline con validación
- ✅ DTOs: `InitialStoreStockDto`, `ProductStockByStoresResponse`

**Archivos:**

- [ProductFormComponent](features-admin/src/lib/pages/products/products-form/product-form.component.ts)
- [ProductStockByStoresComponent](features-admin/src/lib/pages/stores/product-stock-by-stores/product-stock-by-stores.component.ts)
- [StoreAdminService](features-admin/src/lib/services/store-admin.service.ts)

---

### 3. Programa de Lealtad

**Estado:** ✅ Implementado (commits `7835967` - `436995a`)

**Módulos:**

- ✅ Dashboard de métricas
- ✅ Gestión de premios
- ✅ Canjes de usuarios
- ✅ Ajuste manual de puntos
- ✅ Configuración del programa

**Guards:** ✅ `loyaltyFeatureGuard` - valida `features.loyalty`

---

### 4. Feature Guards

**Estado:** ✅ Nuevo (pendiente commit)

**Guards creados:**

- [loyaltyFeatureGuard](features-admin/src/lib/guards/loyalty-feature.guard.ts)
- [multiStoreFeatureGuard](features-admin/src/lib/guards/multi-store-feature.guard.ts)

**Rutas protegidas:**

```ts
/tenant-admin/loyalty/*     → loyaltyFeatureGuard
/tenant-admin/settings/stores/* → multiStoreFeatureGuard
```

---

## ⚠️ Endpoints Backend - Estado

**Base URL:** `http://localhost:5093` (DEV)  
**Tenant:** `test`

### Endpoints Funcionales ✅

| Endpoint                     | Status | Notas                         |
| ---------------------------- | ------ | ----------------------------- |
| `/api/store/products`        | ✅ 200 | Catálogo público funcional    |
| `/api/store/categories`      | ✅ 200 | Categorías públicas funcional |
| `/api/admin/products`        | ✅ 401 | Requiere auth (OK)            |
| `/api/admin/stores`          | ✅ 401 | Requiere auth (OK)            |
| `/api/admin/loyalty/rewards` | ✅ 401 | Requiere auth (OK)            |

### Endpoints con Issues ⚠️

| Endpoint                                    | Status | Issue                             |
| ------------------------------------------- | ------ | --------------------------------- |
| `/api/public/tenant/test`                   | ⚠️ 400 | Requiere tenant header (paradoja) |
| `/api/admin/loyalty/dashboard`              | ❌ 404 | **No implementado en backend**    |
| `/api/admin/loyalty/program/config`         | ❌ 404 | **No implementado en backend**    |
| `/api/admin/store-stock/products/:id/stock` | ❌ 404 | **No implementado en backend**    |

---

## 🚨 Pendientes Críticos

### A) Backend - Endpoints Faltantes (BLOQUEANTE)

**Prioridad: 🔴 ALTA**

1. **Loyalty Backend**

   - ❌ `/api/admin/loyalty/dashboard` → 404
   - ❌ `/api/admin/loyalty/program/config` → 404
   - ✅ `/api/admin/loyalty/rewards` → 401 (existe)

   **Acción:** Verificar con equipo backend si loyalty está desplegado en QA

2. **Multi-Store Backend**

   - ❌ `/api/admin/store-stock/products/:id/stock` → 404

   **Acción:** Confirmar ruta correcta con backend (¿es `/api/admin/products/:id/store-stock`?)

3. **Storefront 500 Errors**

   - ⚠️ `/api/store/products` → 500
   - ⚠️ `/api/store/categories` → 500

   **Acción:** Revisar logs del backend Azure

---

### B) SSR Deshabilitado

**Prioridad: 🟡 MEDIA (SEO)**

Archivo: [.github/workflows/ci.yml](.github/workflows/ci.yml#L44)

```yaml
# TODO - Switch back to SSR build
run: "echo 'TODO: revert to SSR build once NG0201 is fixed'"
```

**Issue:** NG0201 (hydration mismatch)

**Impacto:**

- ❌ No hay pre-rendering
- ❌ SEO degradado
- ❌ Peor FCP (First Contentful Paint)

---

### C) Tests E2E Faltantes

**Prioridad: 🟡 MEDIA**

- ❌ Stock multi-tienda flow
- ❌ Loyalty: acumulación + redención
- ❌ Multitenancy: cambio de tenant + aislamiento de carrito

---

## 📋 Plan de Acción Inmediata

### Paso 1: Validar Backend (1-2h)

```bash
# Contactar con backend team:
# 1. ¿Loyalty está desplegado en la URL de QA?
# 2. ¿La ruta de store-stock es correcta?
# 3. ¿Por qué /api/store/* devuelve 500?
```

### Paso 2: Commitear Guards (10 min)

```bash
git add features-admin/src/lib/guards/
git add features-admin/src/lib/lib.routes.ts
git add features-admin/src/index.ts
git commit -m "feat(admin): add feature guards for loyalty and multi-store"
```

### Paso 3: Tests E2E (4-8h)

- Crear `apps/pwa-e2e/src/multi-store.spec.ts`
- Crear `apps/pwa-e2e/src/loyalty.spec.ts`

### Paso 4: SSR Fix (8-16h)

- Reproducir NG0201 localmente
- Auditar servicios que usan DOM/window
- Habilitar build SSR en CI

---

## 🔧 Comandos Útiles

### Validar Backend

```bash
./scripts/validate-backend-endpoints.sh

# Con tenant específico:
TENANT_SLUG=test ./scripts/validate-backend-endpoints.sh
```

### Desarrollo

```bash
# Dev con mock API
npm run start:dev

# Dev con API real
npm run start:real

# Build prod (browser-only)
npm run build:prod:browser
```

### Cambiar Tenant

```
http://localhost:4200?tenant=test
http://localhost:4200?tenant=otro-tenant
```

---

## 📞 Contactos / Siguiente Paso

**Backend Team:**

- Validar despliegue de loyalty en QA
- Confirmar rutas de store-stock
- Investigar 500 errors en /api/store/\*

**Frontend Team:**

- Commitear feature guards ✅
- Crear tests E2E
- Investigar NG0201 para SSR

---

**Última actualización:** Automatizada desde script de validación  
**Log completo:** [backend-validation.log](backend-validation.log)
