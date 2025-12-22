# ✅ Configuración Completa - Variables de Entorno para Vercel

**Fecha**: 13 de Noviembre de 2025  
**Estado**: ✅ IMPLEMENTADO Y DOCUMENTADO

---

## 📦 Archivos Creados/Modificados

### ✅ Nuevos Archivos

1. **`scripts/inject-env-vars.js`**

   - Script que lee variables de entorno de Vercel
   - Genera `environment.runtime.ts` en build-time
   - Muestra output colorizado con información del proceso

2. **`.env.example`**

   - Plantilla con todas las variables soportadas
   - Comentarios explicativos para cada variable
   - Instrucciones de uso para local y Vercel

3. **`docs/VERCEL_DEPLOYMENT.md`**
   - Guía completa de despliegue en Vercel
   - Instrucciones paso a paso
   - Troubleshooting común
   - Ejemplos de configuración

### ✅ Archivos Modificados

4. **`package.json`**

   - Agregado: `prebuild:vercel` (ejecuta script de inyección)
   - Agregado: `build:vercel` (usa configuración production-vercel)
   - Actualizado: `vercel-build` (ejecuta ambos en secuencia)

5. **`apps/pwa/project.json`**

   - Agregada configuración: `production-vercel`
   - File replacement: usa `environment.runtime.ts` en lugar de `environment.ts`

6. **`vercel.json`**

   - Agregado: `installCommand`
   - Mantiene: `buildCommand` apuntando a `vercel-build`

7. **`.gitignore`**

   - Agregado: `.env`, `.env.local`, `.env.*.local`
   - Agregado: `environment.runtime.ts` (archivo generado)

8. **`README.md`**
   - Agregada sección: Variables de entorno y Despliegue
   - Tabla de variables disponibles
   - Comandos para desarrollo local

---

## 🎯 Cómo Funciona

### 1. **Build Local** (sin variables de entorno)

```bash
npm run build:prod
```

Usa `environment.prod.ts` con valores hardcodeados.

### 2. **Build para Vercel** (con variables de entorno)

```bash
npm run vercel-build
```

**Flujo**:

```
1. Ejecuta: node scripts/inject-env-vars.js
   ├─ Lee: process.env.NG_APP_API_BASE_URL
   ├─ Lee: process.env.NG_APP_VAPID_PUBLIC_KEY
   ├─ Lee: Otras variables...
   └─ Genera: apps/pwa/src/environments/environment.runtime.ts

2. Ejecuta: nx build ecommerce --configuration=production-vercel
   └─ Usa: environment.runtime.ts (con valores de Vercel)

3. Output: dist/apps/ecommerce/browser
```

### 3. **Variables de Entorno Soportadas**

| Variable                  | Default      | Descripción                          |
| ------------------------- | ------------ | ------------------------------------ |
| `NG_APP_API_BASE_URL`     | URL de Azure | **Requerida**: URL del backend       |
| `NG_APP_VAPID_PUBLIC_KEY` | Placeholder  | Clave VAPID para FCM                 |
| `NG_APP_GA_TRACKING_ID`   | `undefined`  | ID de Google Analytics               |
| `NG_APP_ENABLE_ANALYTICS` | `false`      | Habilitar/deshabilitar analytics     |
| `NG_APP_LOG_LEVEL`        | `warn`       | Nivel de logs: debug/info/warn/error |
| `NG_APP_ENABLE_CONSOLE`   | `false`      | Habilitar console.log en producción  |

---

## 🚀 Configuración en Vercel (Paso a Paso)

### Paso 1: Crear Proyecto en Vercel

```bash
# Opción A: Desde Dashboard
1. Ve a https://vercel.com/dashboard
2. Click "Add New Project"
3. Conecta tu repositorio GitHub
4. Click "Import"

# Opción B: Desde CLI
npm i -g vercel
vercel
```

### Paso 2: Configurar Variables de Entorno

**En Vercel Dashboard**:

1. Ve a **Project Settings**
2. Click en **Environment Variables**
3. Agrega cada variable:

#### Para **Production** (Producción)

```
NG_APP_API_BASE_URL = https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
NG_APP_ENABLE_ANALYTICS = true
NG_APP_LOG_LEVEL = warn
NG_APP_ENABLE_CONSOLE = false
NG_APP_GA_TRACKING_ID = G-XXXXXXXXXX
NG_APP_VAPID_PUBLIC_KEY = BHd...tu-clave-vapid
```

☑️ Selecciona: **Production**

#### Para **Preview/Development**

```
NG_APP_API_BASE_URL = https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
NG_APP_ENABLE_ANALYTICS = false
NG_APP_LOG_LEVEL = debug
NG_APP_ENABLE_CONSOLE = true
```

☑️ Selecciona: **Preview** y **Development**

### Paso 3: Configurar Build Settings

**Framework Preset**: Other (o auto-detect)

**Build Command**:

```bash
npm run vercel-build
```

**Output Directory**:

```
dist/apps/ecommerce/browser
```

**Install Command**:

```bash
npm install
```

### Paso 4: Deploy

```bash
# Automático: Push a GitHub
git push origin main

# Manual: Usando Vercel CLI
vercel --prod
```

---

## 💻 Desarrollo Local con API Real

### Opción 1: Archivo `.env.local` (Recomendado)

```bash
# 1. Copia el ejemplo
cp .env.example .env.local

# 2. Edita el archivo
nano .env.local

# Agrega:
NG_APP_API_BASE_URL=https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
NG_APP_LOG_LEVEL=debug
NG_APP_ENABLE_CONSOLE=true

# 3. Ejecuta
npm run start:real
```

### Opción 2: Variables Inline

```bash
NG_APP_API_BASE_URL=https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net \
NG_APP_LOG_LEVEL=debug \
NG_APP_ENABLE_CONSOLE=true \
npm run start:real
```

### Opción 3: Usar `environment.development-real.ts`

```bash
# Ya tiene la URL de Azure hardcodeada
npm run start:real
```

---

## 🧪 Verificar que Funciona

### En Desarrollo Local

```bash
# 1. Ejecuta con API real
npm run start:real

# 2. Abre http://localhost:4200?tenant=tenant-demo

# 3. Abre DevTools Console

# 4. Deberías ver:
🔐 [TenantHeaderInterceptor] GET /api/catalog/products
  📍 URL completa: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
  🏢 Tenant Slug: tenant-demo
  🔑 Tenant Key: 12345678...
```

### En Vercel (Producción)

```bash
# 1. Abre tu URL de Vercel
https://your-app.vercel.app?tenant=tenant-demo

# 2. Abre DevTools > Network

# 3. Navega a /catalog

# 4. Verifica:
#    - Request URL: https://api-ecommerce-...azurewebsites.net/api/...
#    - Headers: X-Tenant-Slug, X-Tenant-Key presentes
#    - Status: 200 OK
```

---

## 📝 Comandos Disponibles

```bash
# Desarrollo con mock API (local)
npm start

# Desarrollo con API real (local)
npm run start:real

# Build de producción (estándar)
npm run build:prod

# Build para Vercel (con env vars)
npm run vercel-build

# Deploy a Vercel
vercel --prod
```

---

## 🔧 Troubleshooting

### ❌ Error: "environment.runtime.ts not found"

**Solución**: Ejecuta el script de inyección manualmente

```bash
node scripts/inject-env-vars.js
```

### ❌ Variables no se aplican en Vercel

**Solución**:

1. Verifica que agregaste las variables en **Environment Variables**
2. Asegúrate de seleccionar **Production** (o Preview/Development)
3. **Redeploy** el proyecto (las variables solo se aplican en nuevos builds)

### ❌ API URL incorrecta en producción

**Solución**:

```bash
# 1. Verifica la variable en Vercel Dashboard
Project Settings > Environment Variables > NG_APP_API_BASE_URL

# 2. Si está correcta, redeploy
Deployments > [último deployment] > ... > Redeploy

# 3. Verifica en el build log
Debe mostrar: "✓ API Base URL: https://api-ecommerce-..."
```

### ❌ Script falla en build

**Solución**: Verifica que Node.js >= 16

```bash
# En Vercel, configura Node version
Project Settings > General > Node.js Version > 18.x o 20.x
```

---

## 📚 Documentación Relacionada

- **Guía completa de Vercel**: [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md)
- **Variables de entorno**: [`.env.example`](.env.example)
- **TenantBootstrapService**: [`docs/TENANT_BOOTSTRAP_BACKEND_INTEGRATION_COMPLETE.md`](docs/TENANT_BOOTSTRAP_BACKEND_INTEGRATION_COMPLETE.md)
- **CatalogService**: [`docs/CATALOG_SERVICE_BACKEND_INTEGRATION.md`](docs/CATALOG_SERVICE_BACKEND_INTEGRATION.md)

---

## ✅ Checklist de Verificación

Usa esta checklist para asegurarte que todo está configurado:

### En el Código

- [ ] `scripts/inject-env-vars.js` existe y tiene permisos de ejecución
- [ ] `.env.example` tiene todas las variables documentadas
- [ ] `package.json` tiene script `vercel-build`
- [ ] `apps/pwa/project.json` tiene configuración `production-vercel`
- [ ] `.gitignore` incluye `.env*` y `environment.runtime.ts`

### En Vercel

- [ ] Proyecto conectado a GitHub
- [ ] Build Command: `npm run vercel-build`
- [ ] Output Directory: `dist/apps/ecommerce/browser`
- [ ] Variable `NG_APP_API_BASE_URL` configurada
- [ ] Variables asignadas a Production/Preview/Development según necesites

### Testing

- [ ] Build local funciona: `npm run vercel-build`
- [ ] Archivo generado existe: `apps/pwa/src/environments/environment.runtime.ts`
- [ ] Variables correctas en el archivo generado
- [ ] Deploy en Vercel exitoso
- [ ] Requests van a la URL correcta en producción
- [ ] Headers de tenant se agregan correctamente

---

**¡Todo listo para desplegar en Vercel con variables de entorno!** 🚀🎉
