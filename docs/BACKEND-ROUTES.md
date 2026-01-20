# 🎯 Rutas Backend Correctas - Referencia Rápida

**Actualizado:** 20 enero 2026  
**Backend DEV:** `http://localhost:5093`

---

## ✅ Endpoints Confirmados (según código frontend)

### Público - Storefront

```
GET  /api/store/products        → Lista de productos del catálogo
GET  /api/store/categories      → Categorías del catálogo
GET  /api/public/tenant/:slug   → Configuración del tenant
```

### Admin - Productos

```
GET    /api/admin/products           → Lista de productos
POST   /api/admin/products           → Crear producto
GET    /api/admin/products/:id       → Detalle de producto
PUT    /api/admin/products/:id       → Actualizar producto
DELETE /api/admin/products/:id       → Eliminar producto
```

### Admin - Tiendas/Sucursales

```
GET    /api/admin/stores                      → Lista de tiendas
POST   /api/admin/stores                      → Crear tienda
GET    /api/admin/stores/:id                  → Detalle de tienda
PUT    /api/admin/stores/:id                  → Actualizar tienda
DELETE /api/admin/stores/:id                  → Eliminar tienda
PUT    /api/admin/stores/:id/set-default      → Marcar como predeterminada
```

### Admin - Stock Multi-Tienda

```
GET  /api/admin/stores/products/:productId/stock         → Stock por tiendas
PUT  /api/admin/stores/products/:productId/stock         → Actualizar stock de tienda
POST /api/admin/stores/products/:productId/check-stock   → Verificar disponibilidad
POST /api/admin/stores/migrate-legacy-stock              → Migrar stock legacy
```

### Admin - Loyalty

```
# Premios
GET    /api/admin/loyalty/rewards           → Lista de premios
POST   /api/admin/loyalty/rewards           → Crear premio
GET    /api/admin/loyalty/rewards/:id       → Detalle de premio
PUT    /api/admin/loyalty/rewards/:id       → Actualizar premio
DELETE /api/admin/loyalty/rewards/:id       → Eliminar premio

# Canjes
GET  /api/admin/loyalty/redemptions         → Lista de canjes

# Puntos
POST /api/admin/loyalty/points/adjust       → Ajustar puntos manualmente

# Configuración
GET  /api/admin/loyalty/config               → Obtener configuración
PUT  /api/admin/loyalty/config               → Actualizar configuración

# Dashboard (NO IMPLEMENTADO)
# GET  /api/admin/loyalty/dashboard          → ❌ 404
```

---

## ⚠️ Notas Importantes

### 1. Stock Multi-Tienda

- La ruta es `/api/admin/stores/products/:id/stock`, NO `/api/admin/store-stock/`
- Frontend envía `InitialStoreStockDto[]` en creación de producto
- Backend debe distribuir el stock entre tiendas

### 2. Loyalty Config

- La ruta es `/api/admin/loyalty/config`, NO `/program/config`
- Incluye configuración de tiers (Bronze, Silver, Gold)
- Puntos por moneda, umbrales, etc.

### 3. Dashboard de Loyalty

- Frontend tiene la página implementada
- Backend NO tiene el endpoint `/api/admin/loyalty/dashboard`
- **Acción:** Implementar o remover del menú temporalmente

---

## 🔧 Comandos de Validación

### Verificar backend local

```bash
curl http://localhost:5093/health
```

### Validar todos los endpoints

```bash
cd /Users/diazbetancur/Proyectos/eCommerce/PWA/PWA-ecommerce
./scripts/validate-backend-endpoints.sh
```

### Validar endpoint específico

```bash
curl -H "X-Tenant-Slug: test" http://localhost:5093/api/admin/loyalty/config
curl -H "X-Tenant-Slug: test" http://localhost:5093/api/admin/stores/products/PRODUCT_ID/stock
```

---

## 📝 Cambios Recientes

**Script de validación corregido:**

- ✅ `/api/admin/loyalty/config` (era `/program/config`)
- ✅ `/api/admin/stores/products/:id/stock` (era `/store-stock/products/:id/stock`)
- ❌ Removido `/api/admin/loyalty/dashboard` (no implementado)
