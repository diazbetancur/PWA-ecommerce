# 🔍 Verificación de Requests - Logging en Modo Desarrollo

**Fecha**: 13 de Noviembre de 2025  
**Estado**: ✅ IMPLEMENTADO

---

## 📋 Resumen

Se han implementado logs detallados en **modo desarrollo** para verificar que todas las requests del frontend:

1. ✅ Usan la base URL correcta: `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net`
2. ✅ Agregan correctamente los headers de tenant (`X-Tenant-Slug`, `X-Tenant-Key`)
3. ✅ Muestran información detallada de timing, status codes y respuestas

---

## 🔧 Componentes Actualizados

### 1. **TenantHeaderInterceptor** (Actualizado)

**Ubicación**: `core/src/lib/interceptors/tenant-header.interceptor.ts`

**Cambios**:
- ✅ Logs detallados **SOLO en modo desarrollo** usando `AppEnvService`
- ✅ Log ANTES de enviar el request (headers agregados)
- ✅ Log DESPUÉS de recibir respuesta (status, duración, body)
- ✅ Log de errores con detalles completos
- ✅ Logs agrupados con `console.group()` para mejor legibilidad
- ✅ Iconos visuales para identificar rápidamente el tipo de log

**Método para detectar modo desarrollo**:
```typescript
private isDevelopment(): boolean {
  return this.envService.isDevelopment && this.envService.isConsoleLoggingEnabled;
}
```

### 2. **ApiClientService** (Verificado)

**Ubicación**: `core/src/lib/services/api-client.service.ts`

**Verificación**:
- ✅ **Construye URLs correctamente**: `${cleanBaseUrl}${relativePath}`
- ✅ Valida que paths sean relativos (deben empezar con `/`)
- ✅ Rechaza URLs absolutas
- ✅ Ya tiene logging integrado (requests/responses)
- ✅ Usa `AppEnvService.apiBaseUrl` para obtener la base URL

**Fragmento clave**:
```typescript
private buildFullUrl(relativePath: string): string {
  // Validar que el path sea relativo
  if (!relativePath.startsWith('/')) {
    throw new Error(`El path debe ser relativo y empezar con '/'. Recibido: ${relativePath}`);
  }

  const baseUrl = this.envService.apiBaseUrl;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const fullUrl = `${cleanBaseUrl}${relativePath}`;  // ✅ Construcción correcta
  
  return fullUrl;
}
```

---

## 📊 Ejemplo de Salida en Consola del Navegador

### Escenario: Llamada a `CatalogService.getProducts()` desde `/catalog`

Cuando navegas a `http://localhost:4200/catalog?tenant=tenant-demo` y el componente llama a `catalogService.getProducts(1, 20)`, verás esta secuencia de logs:

---

#### **1. Log del ApiClientService (Request saliente)**

```
🚀 API Request [2025-11-13T10:15:23.456Z]
  GET /api/catalog/products
  Full URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
  Base URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
  Mock API: false
```

---

#### **2. Log del TenantHeaderInterceptor (Headers agregados)**

```
🔐 [TenantHeaderInterceptor] GET /api/catalog/products?page=1&pageSize=20
  📍 URL completa: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products?page=1&pageSize=20
  🏢 Tenant Slug: tenant-demo
  🔑 Tenant Key: 12345678...
  📋 Headers agregados: {
    X-Tenant-Slug: "tenant-demo",
    X-Tenant-Key: "12345678-1234-1234-1234-123456789abc"
  }
  📨 Todos los headers: {
    Accept: "application/json, text/plain, */*",
    Content-Type: "application/json",
    X-Tenant-Slug: "tenant-demo",
    X-Tenant-Key: "12345678-1234-1234-1234-123456789abc"
  }
```

---

#### **3. Log de la Respuesta Exitosa**

```
✅ [TenantHeaderInterceptor] GET /api/catalog/products?page=1&pageSize=20 - 200
  ⏱️  Duración: 234ms
  📊 Status: 200 OK
  📍 URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products?page=1&pageSize=20
  📥 Response Body: {
    items: [
      {
        id: "prod-1",
        name: "Laptop Dell XPS 15",
        price: 1999.99,
        imageUrl: "https://cdn.tenant-demo.com/products/laptop-dell.jpg",
        sku: "DELL-XPS-15",
        stock: 50,
        active: true,
        categoryName: "Electrónica"
      },
      // ... más productos
    ],
    page: 1,
    pageSize: 20,
    totalCount: 150,
    totalPages: 8,
    hasNextPage: true,
    hasPreviousPage: false
  }
```

---

#### **4. Log del ApiClientService (Response procesada)**

```
✅ API Response [2025-11-13T10:15:23.690Z] - 234ms
  GET /api/catalog/products
  Full URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
  Response: {
    success: true,
    data: [...],  // 20 productos mapeados
    total: 150,
    page: 1,
    pageSize: 20,
    totalPages: 8
  }
```

---

### Ejemplo de Error (Backend no disponible)

Si el backend no responde o hay un error:

```
❌ [TenantHeaderInterceptor] GET /api/catalog/products?page=1&pageSize=20 - ERROR
  ⏱️  Duración: 5002ms
  🚨 Status: 0 
  📍 URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products?page=1&pageSize=20
  💥 Error: Http failure response for https://...: 0 Unknown Error
  📥 Error Body: null
```

---

### Ejemplo de Request Público (Sin Tenant Headers)

Para endpoints públicos como `/api/public/tenant/resolve`:

```
🌐 [TenantHeaderInterceptor] GET /api/public/tenant/resolve?slug=tenant-demo (público, sin tenant headers)
```

---

## 🎯 Verificaciones Realizadas

### ✅ 1. Base URL Correcta

**Verificación en logs**:
```
Full URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
Base URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
```

**Cómo se determina**:
- `AppEnvService.apiBaseUrl` obtiene la URL del entorno
- `ApiClientService.buildFullUrl()` construye: `${baseUrl}${relativePath}`
- Se valida que el path sea relativo (empieza con `/`)
- Se rechaza cualquier URL absoluta hardcodeada

### ✅ 2. Headers de Tenant Agregados

**Verificación en logs**:
```
📋 Headers agregados: {
  X-Tenant-Slug: "tenant-demo",
  X-Tenant-Key: "12345678-1234-1234-1234-123456789abc"
}
```

**Cómo se determina**:
- `TenantContextService.getTenantHeaders()` obtiene slug y key del tenant actual
- `TenantHeaderInterceptor` intercepta TODAS las requests HTTP
- Verifica si la URL requiere tenant headers con `shouldIncludeTenantHeaders()`
- Agrega los headers automáticamente con `req.clone({ setHeaders: {...} })`

### ✅ 3. Timing y Performance

**Verificación en logs**:
```
⏱️  Duración: 234ms
```

**Cómo se mide**:
- `performance.now()` al inicio del interceptor
- `performance.now()` al recibir la respuesta
- Cálculo: `Math.round(endTime - startTime)`

---

## 🔍 Modo Desarrollo vs Producción

### En Desarrollo (`npm start`)

```typescript
// AppEnvService detecta automáticamente
isDevelopment = true
isConsoleLoggingEnabled = true
loggingLevel = 'debug'

// Result: TODOS los logs se muestran
🚀 API Request
🔐 [TenantHeaderInterceptor] GET
✅ [TenantHeaderInterceptor] Response
```

### En Producción (`npm run build`)

```typescript
// AppEnvService detecta automáticamente
isDevelopment = false
isConsoleLoggingEnabled = false

// Result: NO se muestran logs (performance óptimo)
// Consola limpia en producción
```

### Configuración Manual

Puedes controlar el logging en `apps/pwa/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  logging: {
    level: 'debug',        // 'debug' | 'info' | 'warn' | 'error'
    enableConsole: true    // true para activar logs
  }
};
```

---

## 🧪 Cómo Probar

### 1. Levantar la aplicación en modo desarrollo

```bash
cd /Users/diazbetancur/Proyectos/eCommerce/PWA/PWA-ecommerce
npm start
```

### 2. Navegar a la página del catálogo

```
http://localhost:4200/catalog?tenant=tenant-demo
```

### 3. Abrir DevTools → Console

```
Chrome: Cmd+Option+J (Mac) / Ctrl+Shift+J (Windows)
Firefox: Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)
```

### 4. Verificar los logs

Deberías ver:
- 🚀 Request saliente con URL completa
- 🔐 Headers de tenant agregados
- ✅ Respuesta con status 200 y data
- ⏱️  Timing de cada request

### 5. Verificar en Network Tab (Opcional)

**DevTools → Network**:

1. **Busca el request**: `GET /api/catalog/products`
2. **Verifica Headers**:
   ```
   Request URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products?page=1&pageSize=20
   Request Headers:
     X-Tenant-Slug: tenant-demo
     X-Tenant-Key: 12345678-1234-1234-1234-123456789abc
   ```
3. **Verifica Response**:
   - Status: 200 OK
   - Body: JSON con productos

---

## 📝 Checklist de Verificación

Usa esta checklist cuando pruebes en desarrollo:

- [ ] **Base URL correcta**: Logs muestran `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net`
- [ ] **Headers de tenant**: `X-Tenant-Slug` y `X-Tenant-Key` presentes en cada request
- [ ] **Path relativo**: El servicio usa `/api/catalog/products` (no URL absoluta)
- [ ] **Requests agrupados**: Los logs usan `console.group()` para mejor organización
- [ ] **Timing visible**: Cada respuesta muestra duración en milisegundos
- [ ] **Status codes**: Respuestas muestran 200, 404, 500, etc.
- [ ] **Error handling**: Errores se loguean con detalles completos
- [ ] **Requests públicos**: Endpoints públicos muestran "(público, sin tenant headers)"
- [ ] **Solo en desarrollo**: Los logs NO aparecen en producción

---

## 🔧 Troubleshooting

### ❌ No veo logs en la consola

**Posible causa**: Modo producción activo

**Solución**:
```typescript
// Verificar en apps/pwa/src/environments/environment.ts
export const environment = {
  production: false,  // ← Debe ser false
  logging: {
    enableConsole: true  // ← Debe ser true
  }
};
```

### ❌ Headers no se agregan

**Posible causa**: URL no requiere tenant headers

**Solución**: Verificar en logs si aparece:
```
🌐 [TenantHeaderInterceptor] ... (público, sin tenant headers)
```

Si es un endpoint privado que debería tener headers, revisar `TenantContextService.shouldIncludeTenantHeaders()`.

### ❌ URL incorrecta (no usa base URL)

**Posible causa**: Llamando al HttpClient directamente en lugar de ApiClientService

**Solución**: Buscar en el código:
```bash
# Buscar uso directo de HttpClient (MAL)
grep -r "http.get\|http.post" --include="*.ts" features/

# Debe usar ApiClientService (BIEN)
grep -r "apiClient.get\|apiClient.post" --include="*.ts" features/
```

---

## 📚 Documentación Relacionada

- **TenantBootstrapService**: `docs/TENANT_BOOTSTRAP_BACKEND_INTEGRATION_COMPLETE.md`
- **CatalogService**: `docs/CATALOG_SERVICE_BACKEND_INTEGRATION.md`
- **Multi-Tenant Architecture**: `docs/MULTI_TENANT_ARCHITECTURE.md`
- **API Client Service**: `docs/API_CLIENT_SERVICE_REFINADO.md`

---

## ✅ Resumen de Cambios

| Archivo | Cambios | Estado |
|---------|---------|--------|
| `tenant-header.interceptor.ts` | Logs detallados en desarrollo | ✅ Actualizado |
| `api-client.service.ts` | Verificado construcción de URL | ✅ Correcto |
| `app-env.service.ts` | Detecta modo desarrollo | ✅ Ya existía |
| `catalog.service.ts` | Usa ApiClientService | ✅ Ya correcto |

---

**Fin del documento** 🎉
