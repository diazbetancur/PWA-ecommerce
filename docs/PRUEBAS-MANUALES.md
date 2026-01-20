# 🧪 Guía de Pruebas Manuales

**Fecha**: 20 de enero de 2026  
**Estado**: Listo para probar con autenticación  
**Backend**: http://localhost:5093  
**Frontend**: http://localhost:4200?tenant=test

---

## ✅ Verificaciones Previas Completadas

### Servidores

- ✅ Frontend corriendo en puerto 4200
- ✅ Backend corriendo en puerto 5093
- ✅ Backend tiene 1 producto de prueba (`prod-de-prueba`)

### Endpoints Validados (6/8 funcionales)

- ✅ `/api/store/products` → 200 OK (1 producto)
- ✅ `/api/store/categories` → 200 OK
- ✅ `/api/admin/products` → 401 (requiere auth - OK)
- ✅ `/api/admin/stores` → 401 (requiere auth - OK)
- ✅ `/api/admin/loyalty/rewards` → 401 (requiere auth - OK)
- ✅ `/api/admin/loyalty/config` → 401 (requiere auth - OK)
- ⚠️ `/api/store/tenant/config` → 400 (paradoja headers conocida)
- ⚠️ `/api/admin/products/:id/stock` → 405 (requiere auth con método correcto)

### Código Frontend

- ✅ Rutas corregidas en `StoreAdminService`
- ✅ Guards implementados (loyalty, multiStore)
- ✅ Componentes de stock multi-tienda listos
- ✅ Validaciones de distribución funcionando

---

## 🔐 Paso 1: Obtener Credenciales de Admin

**IMPORTANTE**: Necesitas credenciales válidas para probar las funcionalidades de admin.

### Opciones:

**A) Consultar con backend:**

```bash
# Pregunta al equipo backend:
# - ¿Hay usuarios seed en el tenant "test"?
# - ¿Cuál es el email/password de admin de prueba?
```

**B) Crear usuario desde backend:**

```bash
# Si el backend tiene endpoint de registro de admin:
POST http://localhost:5093/api/admin/auth/register
Headers: X-Tenant-Slug: test
Body: {
  "email": "admin@test.com",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "Test"
}
```

**C) Credenciales del Tenant "test":**

```
Email:    admin@yourdomain.com
Password: X6E>np[J
```

- Estas credenciales están configuradas en el backend para el tenant "test"

---

## 🧪 Paso 2: Pruebas con Autenticación

### 2.1 Login Admin

1. **Abrir aplicación:**

   ```
   http://localhost:4200?tenant=test
   ```

2. **Navegar a login:**

   - Buscar enlace "Login" o "Admin"
   - O directo: `http://localhost:4200/admin/login?tenant=test`

3. **Ingresar credenciales:**

   - Email: (el que obtuviste en Paso 1)
   - Password: (el que obtuviste en Paso 1)

4. **Verificar autenticación exitosa:**
   - ✅ Redirección a dashboard
   - ✅ Token almacenado en localStorage
   - ✅ Headers `Authorization: Bearer <token>` en requests

---

### 2.2 Stock Multi-Tienda

#### A) Crear Producto con Distribución de Stock

1. **Navegar a:** `http://localhost:4200/admin/products/new?tenant=test`

2. **Llenar formulario básico:**

   - Nombre: "Producto Test Stock"
   - SKU: "TEST-001"
   - Precio: 50000
   - Stock Total: 100

3. **Verificar sección "Distribución de Stock por Tienda":**

   - ✅ Aparece si `features.multiStore = true`
   - ✅ Muestra lista de tiendas disponibles
   - ✅ Inputs para asignar stock a cada tienda

4. **Distribuir stock:**

   - Tienda 1: 60 unidades
   - Tienda 2: 40 unidades
   - **Total debe ser ≤ 100**

5. **Probar validaciones:**

   - ❌ Intenta poner 60 + 50 = 110 (debe mostrar error)
   - ✅ Ajusta a 60 + 40 = 100 (debe permitir guardar)

6. **Guardar producto:**

   - Verificar request a: `POST /api/admin/products`
   - Body debe incluir: `initialStoreStock: [...]`

7. **Verificar respuesta:**
   - ✅ Producto creado con ID
   - ✅ Redirección a lista de productos
   - ✅ Mensaje de éxito

#### B) Ver Stock por Tiendas

1. **Navegar a:** `http://localhost:4200/admin/stores/stock?tenant=test`

2. **Verificar UI:**

   - ✅ Tabla con columnas: Producto, Tienda, Stock, Última Actualización
   - ✅ Filtros por tienda y producto

3. **Buscar producto creado en (A):**

   - ✅ Debe aparecer con distribución correcta (60 + 40)

4. **Probar request HTTP:**
   - Endpoint: `GET /api/admin/products/:id/stock`
   - Headers: `Authorization: Bearer <token>`, `X-Tenant-Slug: test`
   - Esperado: `200 OK` con `ProductStockByStoresResponse`

#### C) Actualizar Stock de Tienda

1. **En tabla de stock, click en "Editar":**

2. **Modificar cantidad:**

   - Cambiar de 60 a 50 en Tienda 1

3. **Guardar:**

   - Request: `PUT /api/admin/products/:id/stock`
   - Body: `{ storeId: "...", quantity: 50 }`

4. **Verificar:**
   - ✅ Tabla se actualiza
   - ✅ Total stock refleja cambio

---

### 2.3 Loyalty Program

#### A) Cargar Configuración

1. **Navegar a:** `http://localhost:4200/admin/loyalty/config?tenant=test`

2. **Verificar guard:**

   - Si `features.loyalty = false` → Redirección a dashboard con mensaje
   - Si `features.loyalty = true` → Cargar configuración

3. **Probar request:**

   - Endpoint: `GET /api/admin/loyalty/config`
   - Esperado: `200 OK` con configuración actual

4. **Verificar UI:**
   - ✅ Formulario con campos de configuración
   - ✅ Valores cargados desde backend

#### B) Modificar y Guardar

1. **Cambiar valores:**

   - Puntos por compra: 10 → 15
   - Descuento por nivel: 5% → 10%

2. **Guardar:**

   - Request: `PUT /api/admin/loyalty/config`
   - Body: objeto completo de configuración

3. **Recargar página:**
   - ✅ Verificar que cambios persisten
   - ✅ Request GET muestra nuevos valores

#### C) Premios (Rewards)

1. **Navegar a:** `http://localhost:4200/admin/loyalty/rewards?tenant=test`

2. **Ver lista de premios:**

   - Request: `GET /api/admin/loyalty/rewards`
   - Esperado: `200 OK` con array de premios

3. **Crear nuevo premio:**

   - Nombre: "Descuento 20%"
   - Puntos requeridos: 500
   - Tipo: "DISCOUNT"
   - Valor: 20

4. **Guardar:**
   - Request: `POST /api/admin/loyalty/rewards`
   - Verificar premio en lista

---

### 2.4 Feature Guards

#### A) Probar Bloqueo por Features

1. **Modificar config del tenant "test":**

   - En backend o base de datos
   - Cambiar `features.loyalty = false`

2. **Intentar acceder:**

   ```
   http://localhost:4200/admin/loyalty/config?tenant=test
   ```

3. **Verificar comportamiento:**

   - ✅ Guard detecta feature deshabilitada
   - ✅ Redirección a `/admin/dashboard`
   - ✅ Mensaje: "La funcionalidad de Loyalty no está habilitada"

4. **Restaurar:**
   - `features.loyalty = true`
   - Verificar acceso normal

#### B) Probar Guard Multi-Store

1. **Deshabilitar:** `features.multiStore = false`

2. **Intentar acceder:**

   ```
   http://localhost:4200/admin/stores?tenant=test
   ```

3. **Verificar bloqueo similar a (A)**

---

## 📊 Resultados Esperados

### Stock Multi-Tienda

- ✅ Crear producto con distribución inicial
- ✅ Ver stock distribuido por tiendas
- ✅ Actualizar stock de tienda específica
- ✅ Validación: suma ≤ stock total
- ✅ Endpoint `GET /api/admin/products/:id/stock` responde 200

### Loyalty

- ✅ Cargar configuración existente
- ✅ Modificar y persistir cambios
- ✅ Ver lista de premios
- ✅ Crear nuevo premio
- ✅ Guards bloquean acceso si feature deshabilitada

### Feature Guards

- ✅ Redirección si feature no disponible
- ✅ Mensaje de error informativo
- ✅ Acceso normal si feature habilitada

---

## 🐛 Errores Conocidos (No Bloqueantes)

1. **Tenant Config 400:**

   - Endpoint: `/api/store/tenant/config`
   - Causa: Paradoja de headers (requiere tenant en header pero endpoint es para resolver tenant)
   - Impacto: No afecta funcionalidad principal

2. **Stock 405 sin Auth:**

   - Endpoint: `/api/admin/products/:id/stock` (sin token)
   - Esperado: Debe responder 200 con token válido
   - Verificar que backend acepta GET (no solo POST/PUT)

3. **SSR NG0201:**
   - Error de hidratación en producción SSR
   - No bloqueante para desarrollo
   - Marcado como deuda técnica

---

## ✅ Checklist de Pruebas

```
□ Login admin exitoso
□ Token guardado en localStorage
□ Crear producto con stock distribuido
□ Validación de suma de stock funciona
□ Ver tabla de stock por tiendas
□ Actualizar stock de tienda
□ Cargar config de loyalty
□ Modificar y guardar config loyalty
□ Ver lista de premios
□ Crear nuevo premio
□ Guard bloquea loyalty si feature = false
□ Guard bloquea stores si feature = false
□ Endpoints responden 200 con auth
□ UI muestra errores claros
□ Redirecciones funcionan correctamente
```

---

## 🆘 Troubleshooting

### Login falla

```bash
# Verificar tenant existe en backend:
curl -H "X-Tenant-Slug: test" http://localhost:5093/api/store/products?tenant=test

# Verificar endpoint de login:
curl -X POST http://localhost:5093/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: test" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'
```

### Endpoint 401

```bash
# Verificar token en localStorage (navegador):
localStorage.getItem('authToken')

# Probar endpoint manualmente:
curl -H "Authorization: Bearer <TOKEN>" \
     -H "X-Tenant-Slug: test" \
     http://localhost:5093/api/admin/products
```

### Stock endpoint 405

```bash
# Verificar método HTTP permitido:
curl -X OPTIONS http://localhost:5093/api/admin/products/test-id/stock \
  -H "X-Tenant-Slug: test"

# Probar con diferentes métodos:
curl -X GET ...
curl -X POST ...
```

### Guards no redirigen

```typescript
// Verificar en consola del navegador:
console.log(this.tenantContext.currentConfig());
console.log(this.tenantContext.currentConfig()?.features?.loyalty);
```

---

## 📝 Registro de Pruebas

**Usuario probador:** ********\_********  
**Fecha:** ********\_********  
**Backend URL:** http://localhost:5093  
**Frontend URL:** http://localhost:4200?tenant=test

### Credenciales Usadas

- Email: ********\_********
- Password: ********\_********

### Resultados

- Stock Multi-Tienda: ☐ OK ☐ FAIL ☐ N/A
- Loyalty Config: ☐ OK ☐ FAIL ☐ N/A
- Loyalty Rewards: ☐ OK ☐ FAIL ☐ N/A
- Feature Guards: ☐ OK ☐ FAIL ☐ N/A

### Errores Encontrados

```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

### Notas Adicionales

```
_____________________________________________
_____________________________________________
_____________________________________________
```
