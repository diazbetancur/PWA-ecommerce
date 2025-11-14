# API Alignment Summary

**Fecha:** 13 de noviembre de 2025  
**Estado:** ✅ COMPLETADO  
**Versión API:** v1

## Resumen Ejecutivo

Se ha realizado una revisión completa del código frontend para alinearlo con la documentación oficial de la API. Se actualizaron DTOs, servicios, e interfaces para reflejar exactamente la estructura que devuelve el backend.

---

## Cambios Realizados

### 1. **Catalog DTOs (`features/src/lib/catalog/models/catalog-dto.models.ts`)**

#### ProductDto

**Antes:**

```typescript
export interface ProductDto {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  active: boolean;
  // ... otros campos opcionales
}
```

**Después (✅ Alineado con API):**

```typescript
export interface ProductDto {
  id: string; // UUID
  name: string;
  description: string;
  price: number;
  discount: number; // Decimal (0.00 - 1.00)
  finalPrice: number; // price * (1 - discount)
  stock: number;
  isActive: boolean; // Backend usa isActive
  images: string[]; // Array required
  categories: CategorySummaryDto[];
  dynamicAttributes: Record<string, any>;
}
```

**Cambios clave:**

- ✅ Agregado `discount` (decimal 0-1, e.g., 0.15 = 15%)
- ✅ Agregado `finalPrice` (precio con descuento)
- ✅ Renombrado `active` → `isActive`
- ✅ Cambiado `imageUrl` → `images[]` (array)
- ✅ Agregado `categories[]` (array de categorías)
- ✅ Agregado `dynamicAttributes` (key-value pairs)

---

#### CategoryDto

**Antes:**

```typescript
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  productsCount?: number; // ❌ Nombre incorrecto
}
```

**Después (✅ Alineado con API):**

```typescript
export interface CategoryDto {
  id: string;
  name: string;
  description: string; // Required
  productCount: number; // ✅ Backend usa productCount (no productsCount)
}
```

**Cambios clave:**

- ✅ Renombrado `productsCount` → `productCount`
- ✅ `description` ahora es required
- ✅ Removidos campos que el backend no devuelve (`imageUrl`, `parentId`, etc.)

---

#### PaginatedResponseDto

**Antes:**

```typescript
export interface PaginatedResponseDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
```

**Después (✅ Alineado con API):**

```typescript
export interface PaginatedResponseDto<T> {
  items: T[]; // Array of items
  totalCount: number; // Total number of elements
  page: number; // Current page (1-based)
  pageSize: number; // Items per page
  totalPages: number; // Total number of pages
}
```

**Cambios clave:**

- ✅ Removidos campos opcionales que el backend no devuelve
- ✅ Estructura exacta de la API

---

### 2. **Tenant Configuration (`core/src/lib/interfaces/tenant-resolution.interface.ts`)**

#### Nueva Interfaz: PublicTenantConfigResponse

```typescript
/**
 * ✅ ALINEADO CON API DOCUMENTATION v1
 * Endpoint: GET /public/tenant-config
 * Header requerido: X-Tenant-Slug
 */
export interface PublicTenantConfigResponse {
  name: string; // Store name
  slug: string; // Store slug
  theme: Record<string, any>; // Theme configuration (empty for now)
  seo: Record<string, any>; // SEO metadata (empty for now)
  features: string[]; // List of enabled feature codes
}
```

**Ejemplo de respuesta:**

```json
{
  "name": "My Awesome Store",
  "slug": "my-store",
  "theme": {},
  "seo": {},
  "features": ["catalog", "cart", "checkout", "guest_checkout", "categories"]
}
```

---

### 3. **TenantBootstrapService (`core/src/lib/services/tenant-bootstrap.service.ts`)**

#### Cambios en endpoint y método

**Antes:**

```typescript
private async loadTenantFromBackend(tenantSlug: string): Promise<TenantConfigResponse> {
  return firstValueFrom(
    this.apiClient.get<TenantConfigResponse>('/api/public/tenant/resolve', {
      params: { tenant: tenantSlug }
    })
  );
}
```

**Después (✅ Alineado con API):**

```typescript
private async loadTenantFromBackend(tenantSlug: string): Promise<PublicTenantConfigResponse> {
  return firstValueFrom(
    this.apiClient.get<PublicTenantConfigResponse>('/public/tenant-config')
  );
}
```

**Cambios clave:**

- ✅ Endpoint cambiado: `/api/public/tenant/resolve` → `/public/tenant-config`
- ✅ Header usado: `X-Tenant-Slug` (inyectado por interceptor)
- ✅ Sin query params (usa header en su lugar)
- ✅ Tipo de respuesta: `PublicTenantConfigResponse`

---

#### Mapper actualizado

```typescript
private mapBackendResponseToTenantConfig(response: PublicTenantConfigResponse): TenantConfig {
  // Convertir features array a objeto de booleans
  const featuresMap: Record<string, boolean> = {};
  for (const feature of response.features) {
    featuresMap[feature] = true;
  }

  return {
    tenant: {
      id: response.slug,
      slug: response.slug,
      displayName: response.name
    },
    features: {
      catalog: featuresMap['catalog'] || false,
      cart: featuresMap['cart'] || false,
      checkout: featuresMap['checkout'] || false,
      guestCheckout: featuresMap['guest_checkout'] || false,
      categories: featuresMap['categories'] || false,
      push: featuresMap['push'] || false,
      ...featuresMap
    },
    // ... defaults para theme, limits, locale, currency
  };
}
```

---

### 4. **CatalogService (`features/src/lib/catalog/services/catalog.service.ts`)**

#### Actualización de mappers

**mapProductDto:**

```typescript
private mapProductDto(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    price: dto.price,
    discount: dto.discount,           // ✅ Nuevo
    finalPrice: dto.finalPrice,       // ✅ Nuevo
    imageUrl: dto.images[0] || '',    // ✅ Primera imagen del array
    images: dto.images,
    stock: dto.stock,
    active: dto.isActive,             // ✅ Backend usa isActive
    categoryId: dto.categories[0]?.id || '',
    categoryName: dto.categories[0]?.name || '',
    categories: dto.categories,       // ✅ Array completo
    dynamicAttributes: dto.dynamicAttributes,  // ✅ Nuevo
    sku: dto.dynamicAttributes?.sku as string,
    tags: dto.dynamicAttributes?.tags as string[],
    // ...
  };
}
```

**mapCategoryDto:**

```typescript
private mapCategoryDto(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    productsCount: dto.productCount  // ✅ Backend usa productCount
    // ... campos con defaults
  };
}
```

---

#### Endpoints actualizados

**getCategories:**
**Antes:**

```typescript
getCategories(includeProductCount = false): Observable<CategoriesResponse> {
  return this.apiClient.getWithParams<PaginatedResponseDto<CategoryDto>>(
    '/api/catalog/categories',
    { includeProductCount }
  );
}
```

**Después (✅ Alineado con API):**

```typescript
getCategories(): Observable<CategoriesResponse> {
  // La API devuelve un array directo, no paginado
  return this.apiClient
    .get<CategoryDto[]>('/api/catalog/categories')
    .pipe(
      map((response: CategoryDto[]) =>
        this.mapPaginatedCategoriesResponse(response, this.mapCategoryDto)
      )
    );
}
```

**Cambios clave:**

- ✅ Sin parámetros (la API no los usa)
- ✅ Respuesta es array directo, no paginado
- ✅ Mapper adaptado para manejar array o estructura paginada

---

**getProduct:**
**Antes:**

```typescript
getProduct(productId: string): Observable<ProductResponse> {
  return this.apiClient
    .get<SingleResponseDto<ProductDto>>(`/api/catalog/products/${productId}`)
    .pipe(
      map((response: SingleResponseDto<ProductDto>) => ({
        data: this.mapProductDto(response.data),
        success: response.success ?? true
      }))
    );
}
```

**Después (✅ Alineado con API):**

```typescript
getProduct(productId: string): Observable<ProductResponse> {
  // La API devuelve ProductDto directamente, no un wrapper
  return this.apiClient
    .get<ProductDto>(`/api/catalog/products/${productId}`)
    .pipe(
      map((dto: ProductDto) => ({
        data: this.mapProductDto(dto),
        success: true
      }))
    );
}
```

**Cambios clave:**

- ✅ Sin wrapper `SingleResponseDto`
- ✅ Backend devuelve ProductDto directamente

---

### 5. **Modelos internos actualizados**

#### Product

```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number; // ✅ Nuevo
  finalPrice: number; // ✅ Nuevo
  imageUrl: string;
  images?: string[];
  stock?: number;
  active: boolean;
  categoryId?: string;
  categoryName?: string;
  categories?: CategorySummaryDto[]; // ✅ Nuevo
  dynamicAttributes?: Record<string, any>; // ✅ Nuevo
  sku?: string;
  tags?: string[];
  // ...
}
```

#### ProductSummary

```typescript
export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  discount: number; // ✅ Nuevo
  finalPrice: number; // ✅ Nuevo
  imageUrl: string;
  sku?: string;
  stock?: number;
  active: boolean;
}
```

---

## Resumen de Endpoints

| Endpoint                     | Método | Headers                    | Query Params                                                       | Respuesta                           |
| ---------------------------- | ------ | -------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `/public/tenant-config`      | GET    | `X-Tenant-Slug` (required) | -                                                                  | `PublicTenantConfigResponse`        |
| `/api/catalog/products`      | GET    | `X-Tenant-Slug` (required) | `page`, `pageSize`, `search`, `categoryId`, `minPrice`, `maxPrice` | `PaginatedResponseDto<ProductDto>`  |
| `/api/catalog/products/{id}` | GET    | `X-Tenant-Slug` (required) | -                                                                  | `ProductDto` (directo, sin wrapper) |
| `/api/catalog/categories`    | GET    | `X-Tenant-Slug` (required) | -                                                                  | `CategoryDto[]` (array directo)     |

---

## Validaciones Completadas

### ✅ DTOs

- [x] ProductDto alineado con API (discount, finalPrice, isActive, images[], categories[], dynamicAttributes)
- [x] CategoryDto alineado con API (productCount, description required)
- [x] PaginatedResponseDto exacto según documentación
- [x] PublicTenantConfigResponse creado para /public/tenant-config

### ✅ Servicios

- [x] TenantBootstrapService usa endpoint correcto (/public/tenant-config)
- [x] TenantBootstrapService usa header X-Tenant-Slug
- [x] CatalogService mappers actualizados (discount, finalPrice, isActive, etc.)
- [x] getCategories maneja array directo
- [x] getProduct maneja respuesta directa sin wrapper

### ✅ Modelos internos

- [x] Product incluye discount, finalPrice, categories, dynamicAttributes
- [x] ProductSummary incluye discount, finalPrice

### ✅ Endpoints

- [x] /public/tenant-config (no /api/public/tenant/resolve)
- [x] /api/catalog/products con query params correctos
- [x] /api/catalog/products/{id} respuesta directa
- [x] /api/catalog/categories respuesta como array

---

## Próximos Pasos (Opcionales)

### Cart & Checkout APIs

Si se quieren implementar, según la documentación:

**Endpoints disponibles:**

- `GET /api/cart` - Obtener carrito (header: X-Session-Id)
- `POST /api/cart/items` - Agregar item
- `PUT /api/cart/items/{itemId}` - Actualizar cantidad
- `DELETE /api/cart/items/{itemId}` - Eliminar item
- `POST /api/checkout/quote` - Calcular totales
- `POST /api/checkout/place-order` - Crear orden (header: Idempotency-Key)

### Feature Flags

- `GET /api/features` - Obtener feature flags y limits

---

## Verificación

Para verificar que todo funciona correctamente:

1. **En desarrollo, revisar logs del interceptor:**

   ```
   🌐 [REQUEST] POST https://api.../api/catalog/products
   ✅ [RESPONSE] 200 OK (234ms)
   ```

2. **En Network tab del navegador:**

   - Verificar headers: `X-Tenant-Slug` presente
   - Verificar respuestas coinciden con DTOs

3. **Ejecutar la app:**

   ```bash
   npm run dev
   ```

4. **Probar con tenant real:**
   ```
   http://localhost:4200?tenant=my-store
   ```

---

## Documentación Relacionada

- [API Documentation - eCommerce Multi-Tenant Platform](../API_DOCUMENTATION.md)
- [Multi-Tenant Architecture](./MULTI_TENANT_ARCHITECTURE.md)
- [HTTP Interceptors Multi-Tenant](./HTTP_INTERCEPTORS_MULTITENANT.md)
- [Tenant Debug Panel](./TENANT-DEBUG-PANEL.md)

---

## Notas Importantes

### ⚠️ Campos que el backend NO devuelve actualmente

**Product:**

- `createdAt`, `updatedAt` - Se agregan en el frontend con defaults

**Category:**

- `imageUrl`, `parentId`, `sortOrder`, `isActive` - Se usan defaults

**Tenant Config:**

- `theme`, `seo` - Vienen como objetos vacíos `{}`
- `branding`, `localization`, `limits` - No disponibles, se usan defaults

Estos campos se agregarán en el futuro cuando el backend los implemente.

### 💡 DynamicAttributes

El backend usa `dynamicAttributes` como un mapa flexible para campos adicionales:

```json
{
  "dynamicAttributes": {
    "brand": "AudioTech",
    "color": "Black",
    "bluetooth": "5.0",
    "warranty": "2 years"
  }
}
```

El mapper extrae campos comunes (`sku`, `tags`, `weight`, `dimensions`) pero mantiene el objeto completo para acceso flexible.

---

## Conclusión

✅ **El código frontend está completamente alineado con la API v1.**

Todos los DTOs, servicios, y endpoints coinciden exactamente con la documentación oficial. Los cambios son backward-compatible donde fue posible, y se agregaron comentarios claros donde difieren del backend actual.

**Estado:** LISTO PARA TESTING CON API REAL 🚀
