# 🏪 Implementación de Storefront API para Home de Clientes

## 📋 Resumen

Se ha refactorizado completamente el módulo de catálogo para consumir la nueva **Storefront API** (`/api/store`) según la documentación proporcionada. Los cambios garantizan una arquitectura limpia, escalable y mantenible siguiendo las mejores prácticas de Angular.

---

## 🎯 Objetivos Cumplidos

✅ Implementar modelos TypeScript para Storefront API  
✅ Crear servicio `StorefrontApiService` para consumir todos los endpoints  
✅ Refactorizar componentes para usar la nueva API  
✅ Organizar componentes en estructura escalable  
✅ Garantizar envío correcto del header `X-Tenant-Slug`  
✅ Aplicar Clean Code y mejores prácticas de Angular

---

## 🆕 Archivos Creados

### 1. **Modelos** (`features/src/lib/catalog/models/`)

#### `storefront-api.models.ts`

Modelos TypeScript completos basados en la documentación de la API:

**Banners:**

- `StoreBannerDto`

**Categorías:**

- `StoreCategoryDto` (con jerarquía de hijos)
- `StoreCategoryDetailDto` (detalle completo)
- `StoreCategoryRefDto` (referencia simple)

**Productos:**

- `StoreProductDto` (listado)
- `StoreProductDetailDto` (detalle completo)
- `StoreProductImageDto`
- `StoreProductSearchResult` (autocomplete)
- `StoreProductListResponse` (paginación)

**Filtros:**

- `ProductFilters` (todos los filtros soportados)

**Errores:**

- `StorefrontError`

---

### 2. **Servicios** (`features/src/lib/catalog/services/`)

#### `storefront-api.service.ts`

Servicio completo para consumir la Storefront API con métodos para:

**Banners:**

- `getBanners(position?)` → GET `/api/store/banners`

**Categorías:**

- `getCategories(includeInactive?)` → GET `/api/store/categories`
- `getCategoryBySlug(slug)` → GET `/api/store/categories/{slug}`

**Productos:**

- `getProducts(filters?)` → GET `/api/store/products`
- `getFeaturedProducts(limit?)` → GET `/api/store/products/featured`
- `searchProducts(query, limit?)` → GET `/api/store/products/search`
- `getProductBySlug(slug)` → GET `/api/store/products/{slug}`

**Utilidades:**

- `getRelatedProducts(categorySlug, limit?)` - Productos relacionados
- `getProductsByCategory(slug, page, pageSize, filters?)` - Productos por categoría

**Características:**

- ✅ Usa `ApiClientService` (headers automáticos)
- ✅ Tipado fuerte en todas las peticiones
- ✅ Manejo de errores con logs
- ✅ Validaciones de parámetros
- ✅ Documentación completa con JSDoc

---

### 3. **Componentes** (`features/src/lib/catalog/pages/`)

#### `home/` (NUEVO)

Nueva página de inicio para clientes con tenant:

**`home-page.component.ts`**

- 🎨 Carga banners hero
- 📂 Muestra categorías (solo si hay más de 1)
- ⭐ Productos destacados (featured)
- 🔍 Búsqueda con autocomplete (debounce 300ms)
- 🎯 Navegación a catálogo y detalle de productos

**Características:**

- Signals para estado reactivo
- Computed properties para lógica derivada
- Separación clara de responsabilidades
- Manejo de loading states
- Error handling robusto

**`home-page.component.html`**

- Banner carousel (si hay banners)
- Barra de búsqueda con autocomplete
- Grid de categorías responsive
- Grid de productos destacados
- Empty states para casos sin datos

**`home-page.component.scss`**

- Diseño responsive (mobile-first)
- Variables CSS para theming
- Transiciones suaves
- Estados hover/focus accesibles

---

## 🔄 Archivos Actualizados

### 1. **catalog-page.component.ts**

**Cambios:**

- ❌ Eliminado: `CatalogService` (API vieja)
- ❌ Eliminado: `StoreService` (API vieja)
- ✅ Agregado: `StorefrontApiService` (API nueva)
- ✅ Actualizado: Modelos de `storefront-api.models`
- ✅ Refactorizado: Métodos de carga de datos
- ✅ Corregido: Mapeo a `ProductCardData`

**Antes:**

```typescript
this.catalogService.getProducts(page, 20, filters);
```

**Después:**

```typescript
this.storefrontApi.getProducts({ ...filters, page, pageSize: 20 });
```

---

### 2. **catalog.routes.ts**

**Cambios:**

- ✅ Nueva ruta: `''` → `HomePageComponent` (inicio)
- ✅ Movida: `'catalog'` → `CatalogPageComponent` (listado completo)
- ✅ Nueva ruta: `'products/:slug'` → `ProductDetailsComponent` (por slug)
- ✅ Mantenida: `'product/:id'` → `ProductDetailsComponent` (por ID)

**Estructura de rutas:**

```
/ → HomePageComponent (inicio con destacados)
/catalog → CatalogPageComponent (catálogo completo con filtros)
/products/:slug → ProductDetailsComponent (detalle por slug)
/product/:id → ProductDetailsComponent (detalle por ID - legacy)
```

---

### 3. **Exports** (`index.ts`)

#### `catalog/models/index.ts`

```typescript
export * from './catalog-dto.models';
export * from './storefront-api.models'; // ✅ NUEVO
```

#### `catalog/services/index.ts`

```typescript
export * from './catalog.service';
export * from './store.service';
export * from './storefront-api.service'; // ✅ NUEVO
```

#### `catalog/pages/index.ts`

```typescript
export * from './home/home-page.component'; // ✅ NUEVO
export * from './catalog/catalog-page.component';
export * from './categories/categories-page.component';
export * from './product-details/product-details.component';
```

---

## 🔧 Configuración de Headers

### Interceptor `authTenantInterceptor`

**Ubicación:** `core/src/lib/http/auth-tenant.interceptor.ts`

**Funcionamiento:**

1. ✅ Detecta si `env.useTenantHeader === true`
2. ✅ Obtiene `tenantSlug` de `TenantConfigService`
3. ✅ Si no hay, lee del query parameter `?tenant=`
4. ✅ Agrega header `X-Tenant-Slug: {tenantSlug}`
5. ✅ Se aplica automáticamente a TODAS las peticiones HTTP

**No se requiere configuración adicional** - el interceptor ya está activo.

---

## 📊 Endpoints Consumidos

### Storefront API Base: `/api/store`

| Endpoint                       | Método | Descripción           | Implementado |
| ------------------------------ | ------ | --------------------- | ------------ |
| `/api/store/banners`           | GET    | Banners activos       | ✅           |
| `/api/store/categories`        | GET    | Árbol de categorías   | ✅           |
| `/api/store/categories/{slug}` | GET    | Detalle de categoría  | ✅           |
| `/api/store/products`          | GET    | Productos con filtros | ✅           |
| `/api/store/products/featured` | GET    | Productos destacados  | ✅           |
| `/api/store/products/search`   | GET    | Búsqueda autocomplete | ✅           |
| `/api/store/products/{slug}`   | GET    | Detalle de producto   | ✅           |

---

## 🎨 Estructura de Componentes

```
features/src/lib/catalog/
├── models/
│   ├── catalog.models.ts (modelos internos)
│   ├── catalog-dto.models.ts (DTOs viejos - mantener por compatibilidad)
│   └── storefront-api.models.ts ✨ (DTOs nuevos de Storefront API)
├── services/
│   ├── catalog.service.ts (servicio viejo - deprecar gradualmente)
│   ├── store.service.ts (servicio viejo - deprecar gradualmente)
│   └── storefront-api.service.ts ✨ (servicio nuevo - usar este)
├── pages/
│   ├── home/ ✨ (NUEVO)
│   │   ├── home-page.component.ts
│   │   ├── home-page.component.html
│   │   └── home-page.component.scss
│   ├── catalog/
│   │   ├── catalog-page.component.ts (actualizado)
│   │   ├── catalog-page.component.html
│   │   └── catalog-page.component.scss
│   ├── categories/
│   │   └── categories-page.component.ts
│   └── product-details/
│       └── product-details.component.ts
└── components/
    ├── banner-carousel/
    ├── category-carousel/
    ├── product-grid/
    └── public-header/
```

---

## 🧪 Testing

### Pruebas Manuales Recomendadas

1. **Home Page**

   - ✅ Cargar página sin tenant → debe redirigir
   - ✅ Cargar página con tenant válido → debe mostrar contenido
   - ✅ Verificar que se muestran banners
   - ✅ Verificar que se muestran categorías (si hay > 1)
   - ✅ Verificar que se muestran productos destacados

2. **Búsqueda**

   - ✅ Escribir menos de 2 caracteres → no debe buscar
   - ✅ Escribir 2+ caracteres → debe mostrar resultados después de 300ms
   - ✅ Click en resultado → debe navegar al producto

3. **Navegación**

   - ✅ Click en categoría → debe filtrar productos
   - ✅ Click en "Ver todos" → debe ir a `/catalog`
   - ✅ Click en producto → debe ir a `/products/{slug}`

4. **Headers**
   - ✅ Abrir DevTools → Network
   - ✅ Hacer petición → verificar header `X-Tenant-Slug`
   - ✅ Cambiar tenant → verificar que cambia el header

---

## 🚀 Siguiente Pasos Recomendados

### Inmediato

- [ ] Actualizar `categories-page.component.ts` para usar `StorefrontApiService`
- [ ] Actualizar `product-details.component.ts` para usar `StorefrontApiService`
- [ ] Deprecar `CatalogService` y `StoreService` gradualmente

### Corto Plazo

- [ ] Implementar carrito de compras
- [ ] Implementar modal de vista rápida de producto
- [ ] Agregar paginación infinita en home
- [ ] Agregar filtros avanzados en catálogo

### Medio Plazo

- [ ] Implementar caché de productos destacados
- [ ] Agregar Service Worker para offline
- [ ] Optimizar imágenes con lazy loading
- [ ] Implementar Analytics tracking

---

## 📝 Notas Importantes

### Header X-Tenant-Slug

- ✅ **Se envía automáticamente** en todas las peticiones HTTP
- ✅ El interceptor `authTenantInterceptor` lo maneja
- ✅ No requiere configuración adicional en los servicios
- ⚠️ Asegurarse de que `env.useTenantHeader === true` en el environment

### Compatibilidad

- ✅ Los servicios viejos (`CatalogService`, `StoreService`) aún funcionan
- ✅ Se pueden deprecar gradualmente
- ✅ Los componentes de admin usan servicios diferentes (no afectados)

### Clean Code Aplicado

- ✅ Principio de Responsabilidad Única
- ✅ Separación de preocupaciones
- ✅ Tipado fuerte
- ✅ Nombres descriptivos
- ✅ Documentación con JSDoc
- ✅ Error handling consistente
- ✅ Signals para reactividad
- ✅ Computed properties para lógica derivada

---

## 🔍 Verificación de Funcionamiento

### Comandos útiles

```bash
# Compilar el proyecto
npm run build

# Ejecutar en desarrollo
npm run start:dev

# Ver errores de TypeScript
npx tsc --noEmit

# Ver errores de lint
npm run lint
```

### Checklist de Verificación

- [x] Los modelos TypeScript están completos
- [x] El servicio `StorefrontApiService` está implementado
- [x] El componente `HomePageComponent` está creado
- [x] El componente `CatalogPageComponent` está actualizado
- [x] Las rutas están configuradas correctamente
- [x] Los exports están actualizados
- [x] Los errores de compilación están corregidos
- [x] Se usa Clean Code y mejores prácticas
- [x] La estructura es escalable y mantenible

---

## 👨‍💻 Autor

Implementado siguiendo:

- ✅ Clean Code principles
- ✅ SOLID principles
- ✅ Angular Style Guide
- ✅ TypeScript best practices
- ✅ Arquitectura limpia

---

## 📚 Referencias

- [Storefront API Documentation](../docs/STOREFRONT_API_DOCUMENTATION.md)
- [Angular Style Guide](https://angular.dev/style-guide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Best Practices](https://rxjs.dev/guide/overview)
