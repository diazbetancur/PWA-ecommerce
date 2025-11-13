# 🌐 CatalogService - Integración con Backend Real de Azure

**Fecha**: 13 de Noviembre de 2025  
**Estado**: ✅ COMPLETADO  
**Backend**: `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net`

---

## 📋 Resumen

El `CatalogService` ahora consume el backend real de Azure usando el `ApiClientService`. NO hardcodea URLs, solo usa paths relativos. Los headers de tenant (X-Tenant-Slug, X-Tenant-Key) se inyectan automáticamente vía `TenantHeaderInterceptor`.

---

## 🔌 Endpoints Integrados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `getProducts()` | `GET /api/catalog/products` | Lista paginada de productos con filtros |
| `getProduct(id)` | `GET /api/catalog/products/{id}` | Detalle de un producto específico |
| `getCategories()` | `GET /api/catalog/categories` | Lista de categorías disponibles |
| `getFeaturedProducts()` | `GET /api/catalog/products/featured` | Productos destacados |
| `searchProducts()` | Usa `getProducts()` con filtro `search` | Búsqueda de productos por texto |
| `getProductsByCategory()` | Usa `getProducts()` con filtro `categoryId` | Productos de una categoría |

---

## 📦 Arquitectura de DTOs

### Backend DTOs (Azure → Frontend)

**Ubicación**: `features/src/lib/catalog/models/catalog-dto.models.ts`

```typescript
// Lo que devuelve el backend de Azure
interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  images?: string[];
  categoryId: string | null;
  categoryName?: string | null;
  sku: string | null;
  stock: number;
  active: boolean;
  tags: string[];
  weight?: number | null;
  dimensions?: { length, width, height } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductSummaryDto {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  sku: string | null;
  stock: number;
  active: boolean;
  categoryName?: string | null;
}

interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
  productsCount?: number;
}

interface PaginatedResponseDto<T> {
  items: T[];              // 🔧 Si tu backend usa "data", cambiar aquí
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

interface SingleResponseDto<T> {
  data: T;
  success?: boolean;
  message?: string | null;
}
```

### Modelos Internos (Frontend)

**Ubicación**: `features/src/lib/catalog/models/catalog.models.ts`

```typescript
// Modelos del dominio interno
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  sku?: string;
  stock?: number;
  active: boolean;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  weight?: number;
  dimensions?: { length, width, height };
  createdAt: string;
  updatedAt: string;
}

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sku?: string;
  stock?: number;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  active: boolean;
  productsCount?: number;
}
```

### Respuestas del Servicio

```typescript
interface ProductsResponse {
  success: boolean;
  data: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message?: string;
}

interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message?: string;
}
```

---

## 🔄 Flujo de Datos

```
┌──────────────────────────────────────────────────────────────┐
│ 1. COMPONENTE                                                │
│    CatalogPageComponent.loadProducts()                        │
│    → catalogService.getProducts(page, pageSize, filters)     │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. SERVICIO                                                  │
│    CatalogService.getProducts()                               │
│    → apiClient.getWithParams<PaginatedResponseDto>(...)      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. API CLIENT                                                │
│    ApiClientService construye URL completa:                   │
│    baseUrl + '/api/catalog/products' + query params          │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. INTERCEPTOR                                               │
│    TenantHeaderInterceptor agrega headers:                    │
│    - X-Tenant-Slug: {slug}                                   │
│    - X-Tenant-Key: {uuid}                                    │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. BACKEND AZURE                                             │
│    https://api-ecommerce-...azurewebsites.net                │
│    GET /api/catalog/products?page=1&pageSize=20              │
│    ← Devuelve PaginatedResponseDto<ProductSummaryDto>        │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. MAPPER                                                    │
│    CatalogService.mapPaginatedProductsResponse()              │
│    → Convierte ProductSummaryDto → ProductSummary            │
│    → Convierte PaginatedResponseDto → ProductsResponse       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. COMPONENTE                                                │
│    Recibe ProductsResponse con ProductSummary[]              │
│    → mapToCardData() → ProductCardData                       │
│    → ProductCardComponent muestra los productos              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Puntos de Adaptación

### 1. Si el Backend Usa "data" en Lugar de "items"

**Archivo**: `catalog-dto.models.ts`

```typescript
export interface PaginatedResponseDto<T> {
  data: T[];  // ← Cambiar "items" por "data"
  page: number;
  // ...
}
```

**Archivo**: `catalog.service.ts` (método mapper)

```typescript
private mapPaginatedProductsResponse(...) {
  return {
    success: true,
    data: response.data.map(mapper.bind(this)),  // ← Cambiar items por data
    // ...
  };
}
```

### 2. Si el Backend Devuelve Producto Directamente (Sin Wrapper)

**En `getProduct()` cambiar:**

```typescript
// DE ESTO:
.get<SingleResponseDto<ProductDto>>(`/api/catalog/products/${productId}`)
.pipe(
  map((response: SingleResponseDto<ProductDto>) => ({
    data: this.mapProductDto(response.data),
    success: response.success ?? true,
    message: response.message
  }))
)

// A ESTO:
.get<ProductDto>(`/api/catalog/products/${productId}`)
.pipe(
  map((dto: ProductDto) => ({
    data: this.mapProductDto(dto),
    success: true,
    message: undefined
  }))
)
```

### 3. Si el Backend Usa Nombres Diferentes

**En los métodos mapper:**

```typescript
private mapProductDto(dto: ProductDto): Product {
  return {
    // ...campos existentes...
    price: dto.unitPrice,        // Si el campo se llama "unitPrice"
    stock: dto.quantity,         // Si el campo se llama "quantity"
    imageUrl: dto.mainImage || dto.thumbnailUrl,  // Prioridad/fallback
    // ...
  };
}
```

### 4. Si Necesitas Agregar Campos (Ej: Rating, Discount)

**Paso 1**: Actualiza los DTOs

```typescript
// catalog-dto.models.ts
export interface ProductDto {
  // ...campos existentes...
  discount?: number;
  discountedPrice?: number;
  rating?: number;
  reviewsCount?: number;
}
```

**Paso 2**: Actualiza los modelos internos

```typescript
// catalog.models.ts
export interface Product {
  // ...campos existentes...
  discount?: number;
  discountedPrice?: number;
  rating?: number;
  reviewsCount?: number;
}
```

**Paso 3**: Actualiza el mapper

```typescript
private mapProductDto(dto: ProductDto): Product {
  return {
    // ...campos existentes...
    discount: dto.discount,
    discountedPrice: dto.discountedPrice,
    rating: dto.rating,
    reviewsCount: dto.reviewsCount
  };
}
```

### 5. Debugging - Ver Qué Devuelve el Backend

```typescript
import { tap } from 'rxjs/operators';

getProducts(...) {
  return this.apiClient
    .getWithParams<PaginatedResponseDto<ProductSummaryDto>>(...)
    .pipe(
      tap(response => {
        console.log('📦 Backend response:', response);
        console.log('📦 Items:', response.items);
        console.log('📦 Pagination:', {
          page: response.page,
          totalCount: response.totalCount
        });
      }),
      map((response: PaginatedResponseDto<ProductSummaryDto>) =>
        this.mapPaginatedProductsResponse(response, this.mapProductSummaryDto)
      ),
      // ...
    );
}
```

---

## 🧪 Testing

### Verificar la Conexión al Backend

1. **Navega a la página del catálogo**:
   ```
   http://localhost:4200/catalog?tenant=tenant-demo
   ```

2. **Abre DevTools → Network** y verifica las llamadas:
   ```
   Request URL: https://api-ecommerce-...azurewebsites.net/api/catalog/products?page=1&pageSize=20
   Request Headers:
     X-Tenant-Slug: tenant-demo
     X-Tenant-Key: {uuid del tenant}
   ```

3. **Verifica la respuesta** (debe coincidir con `PaginatedResponseDto<ProductSummaryDto>`):
   ```json
   {
     "items": [
       {
         "id": "prod-1",
         "name": "Producto A",
         "price": 1999.99,
         "imageUrl": "https://...",
         "sku": "SKU-001",
         "stock": 50,
         "active": true,
         "categoryName": "Electrónica"
       }
     ],
     "page": 1,
     "pageSize": 20,
     "totalCount": 150,
     "totalPages": 8,
     "hasNextPage": true,
     "hasPreviousPage": false
   }
   ```

4. **Verifica que el componente muestra los productos**:
   - Grid de productos con imágenes
   - Precios formateados con TenantCurrencyPipe
   - Badge de stock
   - Paginación funcional

### Testing de Errores

1. **Desconecta el backend** (apaga el servidor Azure) y verifica:
   - Mensaje de error amigable
   - Botón "Reintentar" funcional
   - No hay errores en consola del browser

2. **Prueba con tenant inexistente**:
   ```
   http://localhost:4200/catalog?tenant=fake-tenant-xyz
   ```
   - Debe mostrar error de tenant no encontrado (desde TenantBootstrapService)
   - Redirige a `/tenant/not-found`

3. **Prueba búsqueda y filtros**:
   - Buscar "laptop" → debe llamar a `/api/catalog/products?search=laptop`
   - Filtrar por categoría → debe llamar con `categoryId=...`
   - Combinar filtros → debe enviar todos los parámetros

---

## 📁 Archivos Modificados/Creados

### Creados

1. **`features/src/lib/catalog/models/catalog-dto.models.ts`**
   - DTOs del backend: `ProductDto`, `ProductSummaryDto`, `CategoryDto`
   - Wrappers de respuesta: `PaginatedResponseDto<T>`, `SingleResponseDto<T>`
   - Re-exporta modelos internos de `catalog.models.ts`
   - Marcadores 🔧 para puntos de adaptación

### Modificados

2. **`features/src/lib/catalog/services/catalog.service.ts`**
   - ✅ Usa `ApiClientService` en lugar de mocks
   - ✅ Métodos mapper: `mapProductDto()`, `mapProductSummaryDto()`, `mapCategoryDto()`
   - ✅ Mappers de respuestas: `mapPaginatedProductsResponse()`, `mapPaginatedCategoriesResponse()`
   - ✅ Manejo de errores con `catchError()`
   - ✅ Documentación completa con ejemplos
   - ✅ Comentarios de adaptación para cada endpoint

### Sin Cambios (Compatible)

3. **`features/src/lib/catalog/pages/catalog-page.component.ts`**
   - No requiere cambios, ya consume `CatalogService` correctamente
   - Usa `ProductsResponse` con `success`, `data`, `total`, etc.
   - Compatible con la nueva estructura

4. **`shared/src/lib/ui/product-card/product-card.component.ts`**
   - No requiere cambios, usa `ProductCardData` simple
   - Compatible con `ProductSummary` mapeado

5. **`features/src/lib/catalog/models/catalog.models.ts`**
   - Mantiene los modelos internos sin cambios
   - Define: `Product`, `ProductSummary`, `Category`, `CatalogFilters`

---

## ✅ Checklist de Integración

- [x] `ApiClientService` integrado (no URLs hardcodeadas)
- [x] DTOs del backend definidos en `catalog-dto.models.ts`
- [x] Métodos mapper implementados en `CatalogService`
- [x] Respuestas del servicio compatibles con `CatalogPageComponent`
- [x] Headers de tenant inyectados automáticamente
- [x] Manejo de errores con `catchError()`
- [x] Documentación completa con ejemplos de adaptación
- [x] Compatible con TenantCurrencyPipe (formateo de precios)
- [x] Compatible con ProductCardComponent
- [x] Soporte de paginación
- [x] Soporte de filtros (categoría, búsqueda, stock, precio)

---

## 🚀 Próximos Pasos

1. **Testing E2E**: Agregar tests con Playwright en `apps/pwa-e2e/`
2. **CartService**: Integrar con backend real para agregar productos al carrito
3. **CheckoutService**: Implementar flujo de checkout con backend
4. **OrdersService**: Consultar órdenes del usuario
5. **AdminService**: Panel de administración para gestionar productos/categorías

---

## 📞 Soporte

Si el backend devuelve una estructura diferente a la esperada:

1. **Revisa la respuesta real** en DevTools → Network → Response
2. **Actualiza los DTOs** en `catalog-dto.models.ts` según la respuesta
3. **Ajusta los mappers** en `catalog.service.ts` para mapear correctamente
4. **Usa los marcadores 🔧** para identificar los puntos de adaptación

**Ejemplo**: Si el backend devuelve `{ results: [...], count: 100 }` en lugar de `{ items: [...], totalCount: 100 }`:

```typescript
// catalog-dto.models.ts
export interface PaginatedResponseDto<T> {
  results: T[];      // ← Cambiar "items"
  count: number;     // ← Cambiar "totalCount"
  page: number;
  // ...
}

// catalog.service.ts
private mapPaginatedProductsResponse(...) {
  return {
    success: true,
    data: response.results.map(mapper.bind(this)),  // ← Cambiar items
    total: response.count,                          // ← Cambiar totalCount
    // ...
  };
}
```

---

**Fin del documento** 🎉
