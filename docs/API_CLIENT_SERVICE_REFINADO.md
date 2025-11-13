# 🔗 ApiClientService - Implementación Refinada

## 📋 Resumen de Cambios Implementados

Se ha refactorizado completamente el `ApiClientService` para que **siempre use la URL base del backend** y reciba únicamente **paths relativos**. Todos los servicios del proyecto han sido migrados para usar este patrón.

---

## 🎯 Características Principales

### ✅ **Paths Relativos Únicamente**
- El servicio acepta solo paths relativos (ej: `/api/catalog/products`)
- Construye automáticamente la URL completa: `${apiBaseUrl}${relativePath}`
- Validaciones automáticas para prevenir URLs absolutas

### ✅ **Integración Total con AppEnvService**
- Usa automáticamente la configuración del entorno actual
- Logging inteligente según el entorno (verbose en dev, mínimo en prod)
- Construcción de URLs basada en `apiBaseUrl` del entorno

### ✅ **Type Safety Completo**
- Interfaces TypeScript para todas las opciones y respuestas
- Métodos fuertemente tipados con generics
- Validación en tiempo de compilación

### ✅ **Logging Avanzado**
- Logs de construcción de URL en modo debug
- Información completa de requests/responses
- Control granular según configuración del entorno

---

## 🔧 API Principal

### **Métodos HTTP Básicos**

```typescript
// GET request
get<T>(relativePath: string, options?: ApiRequestOptions, clientOptions?: ApiClientOptions): Observable<T>

// POST request
post<TResponse, TBody>(relativePath: string, body: TBody, options?: ApiRequestOptions, clientOptions?: ApiClientOptions): Observable<TResponse>

// PUT request
put<TResponse, TBody>(relativePath: string, body: TBody, options?: ApiRequestOptions, clientOptions?: ApiClientOptions): Observable<TResponse>

// PATCH request
patch<TResponse, TBody>(relativePath: string, body: TBody, options?: ApiRequestOptions, clientOptions?: ApiClientOptions): Observable<TResponse>

// DELETE request
delete<T>(relativePath: string, options?: ApiRequestOptions, clientOptions?: ApiClientOptions): Observable<T>
```

### **Métodos de Utilidad**

```typescript
// GET con parámetros de query
getWithParams<T>(relativePath: string, params: Record<string, string | number | boolean>): Observable<T>

// Request con timeout personalizado
withTimeout<T>(relativePath: string, method: HttpMethod, body?: unknown, timeout?: number): Observable<T>

// Health check del API
getHealthCheck(): Observable<{status: string; timestamp: string; version?: string}>

// Configuración de tenant
getTenantConfig(tenantSlug: string): Observable<unknown>

// Métodos de conveniencia para catálogo
getCatalog<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T>

// Métodos de administración
admin<T>(endpoint: string, method: HttpMethod, body?: unknown, params?: Record<string, string | number | boolean>): Observable<T>
```

### **Métodos de Información**

```typescript
// Obtener URL completa para debugging
getFullUrl(relativePath: string): string

// Información del cliente
getClientInfo(): {baseUrl: string; mockApi: boolean; loggingEnabled: boolean; environment: string}
```

---

## 💡 Ejemplos de Uso

### **Uso Básico**

```typescript
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiClient = inject(ApiClientService);

  // ✅ Correcto - Path relativo
  getProducts(): Observable<Product[]> {
    return this.apiClient.get<Product[]>('/api/catalog/products');
  }

  // ✅ Correcto - Con parámetros
  searchProducts(query: string): Observable<Product[]> {
    return this.apiClient.getWithParams<Product[]>('/api/catalog/products', {
      q: query,
      limit: 20
    });
  }

  // ✅ Correcto - POST con tipado
  createProduct(product: CreateProductDto): Observable<Product> {
    return this.apiClient.post<Product, CreateProductDto>(
      '/api/admin/products',
      product
    );
  }

  // ❌ Incorrecto - URL absoluta (lanzará error)
  // getProducts(): Observable<Product[]> {
  //   return this.apiClient.get('https://api.example.com/products');
  // }
}
```

### **Uso Avanzado con CatalogService**

```typescript
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly apiClient = inject(ApiClientService);

  // Búsqueda con filtros complejos
  getProducts(filters: ProductFilters): Observable<PaginatedResponse<Product>> {
    return this.apiClient.getWithParams<PaginatedResponse<Product>>(
      '/api/catalog/products',
      this.buildParams(filters)
    );
  }

  // Uso del método de conveniencia getCatalog()
  getCategories(): Observable<Category[]> {
    return this.apiClient.getCatalog<Category[]>('categories');
  }

  // Uso del método admin()
  getProductsAsAdmin(): Observable<Product[]> {
    return this.apiClient.admin<PaginatedResponse<Product>>(
      'products',
      'GET',
      undefined,
      { includeDrafts: true }
    ).pipe(
      map(response => response.items)
    );
  }

  // Request con timeout personalizado
  getProductWithTimeout(id: string): Observable<Product> {
    return this.apiClient.withTimeout<Product>(
      `/api/catalog/products/${id}`,
      'GET',
      undefined,
      10000 // 10 segundos
    );
  }
}
```

### **Construcción de URLs - Interno**

```typescript
// El ApiClientService construye automáticamente:
const relativePath = '/api/catalog/products';
const fullUrl = `${this.envService.apiBaseUrl}${relativePath}`;

// Ejemplos de construcción:
// Development Mock:     http://localhost:5200/api/catalog/products
// Development Real:     https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
// Production:           https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
```

---

## 📊 Migración Completada

### **Archivos Migrados Exitosamente**

✅ **HttpApiAdapter** (`core/src/lib/api/adapters/http-api.adapter.ts`)
- Migrado de URLs absolutas con `${this.base}` a paths relativos
- Todos los endpoints (products, categories, cart, orders, auth, admin, superadmin)
- Mantiene la misma API pública, cambios internos únicamente

✅ **TenantConfigService** (`core/src/lib/services/tenant-config.service.ts`)
- Usa `ApiClientService` para backend real
- Mantiene `HttpClient` directo para archivos JSON locales (modo mock)
- Lógica híbrida según configuración del entorno

### **Servicios de Ejemplo Creados**

✅ **CatalogExampleService** (`features/src/lib/services/catalog-example.service.ts`)
- Implementación completa con todas las mejores prácticas
- Tipos fuertemente tipados
- Manejo de errores y estados reactivos con signals
- Ejemplos de todos los métodos del ApiClientService

✅ **ApiUsageDemoComponent** (`shared/src/lib/demos/api-usage-demo.component.ts`)
- Componente interactivo para demostrar el uso
- Tests de conectividad y health checks
- Ejemplos en vivo de construcción de URLs
- Demostración de diferentes patrones de uso

### **Archivos sin Violaciones**

La verificación automática confirma que **todos los servicios del proyecto** ahora usan correctamente el `ApiClientService` y no hacen uso directo de `HttpClient` (excepto los casos permitidos específicamente).

---

## 🔍 Validaciones y Controles

### **Validación de Paths**

```typescript
// ✅ Paths válidos
'/api/catalog/products'
'/api/admin/users'
'/health'
'/api/public/tenant/resolve'

// ❌ Paths inválidos (lanzan error)
'api/products'                    // No empieza con /
'http://example.com/api'          // URL absoluta
'https://api.example.com/data'    // URL absoluta con HTTPS
```

### **Logging Inteligente**

```typescript
// En development con loggingLevel: 'debug'
console.log('🔗 URL Built: https://api.example.com/api/products', {
  baseUrl: 'https://api.example.com',
  relativePath: '/api/products',
  mockApi: false
});

// En production (solo errores críticos)
// Logging mínimo automáticamente
```

### **Verificación Automática**

```bash
# Script de verificación incluido
npm run verify:azure

# O directamente
node scripts/check-httpclient-usage.js
```

---

## 🎉 Beneficios Obtenidos

### 🎯 **Consistencia Total**
- Un solo patrón en todo el proyecto
- URLs siempre construidas correctamente
- Configuración centralizada del backend

### 🔧 **Mantenimiento Simplificado**
- Cambio de backend URL en un solo lugar
- Switching automático entre mock/real según entorno
- Logging y debugging mejorado

### 🛡️ **Type Safety**
- Prevención de errores en tiempo de compilación
- Interfaces claras para requests/responses
- Validaciones automáticas de paths

### ⚡ **Performance Optimizada**
- Logging condicional según entorno
- Timeouts configurables
- Manejo de errores centralizado

### 📈 **Escalabilidad**
- Fácil adición de nuevos endpoints
- Métodos de utilidad reutilizables
- Patrones consistentes para nuevos servicios

---

## 🚀 Comandos de Verificación

```bash
# Verificar configuración completa
npm run verify:azure

# Verificar uso correcto de ApiClientService
node scripts/check-httpclient-usage.js

# Iniciar en desarrollo con API real
npm run start:real

# Verificar que todo funciona
npm start  # Modo mock por defecto
```

---

## 🎯 Próximos Pasos Recomendados

1. **Probar la integración** con el backend real de Azure
2. **Revisar logs** para verificar construcción correcta de URLs
3. **Añadir nuevos endpoints** siguiendo los patrones establecidos
4. **Configurar CORS** en el backend de Azure si es necesario
5. **Implementar autenticación** usando los métodos auth del ApiAdapter

¡El ApiClientService está ahora completamente refinado y listo para usar con tu backend de Azure! 🌐✨
