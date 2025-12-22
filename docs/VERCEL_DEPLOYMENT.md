# 🚀 Despliegue en Vercel con Variables de Entorno

Este documento explica cómo configurar y desplegar la PWA eCommerce en Vercel usando variables de entorno para conectarse al backend de Azure.

---

## 📋 Tabla de Contenidos

- [Variables de Entorno](#-variables-de-entorno)
- [Desarrollo Local con API Real](#-desarrollo-local-con-api-real)
- [Despliegue en Vercel](#-despliegue-en-vercel)
- [Troubleshooting](#-troubleshooting)

---

## 🔐 Variables de Entorno

La aplicación soporta las siguientes variables de entorno:

| Variable                  | Descripción                  | Ejemplo                                      | Requerida                           |
| ------------------------- | ---------------------------- | -------------------------------------------- | ----------------------------------- |
| `NG_APP_API_BASE_URL`     | URL base del backend API     | `https://api-ecommerce-...azurewebsites.net` | ✅ Sí                               |
| `NG_APP_VAPID_PUBLIC_KEY` | Clave pública VAPID para FCM | `BHd...`                                     | ⚠️ Solo si usas notificaciones push |
| `NG_APP_GA_TRACKING_ID`   | ID de Google Analytics       | `G-XXXXXXXXXX`                               | ❌ No                               |
| `NG_APP_ENABLE_ANALYTICS` | Habilitar analytics          | `true` o `false`                             | ❌ No (default: false)              |
| `NG_APP_LOG_LEVEL`        | Nivel de logs                | `debug`, `info`, `warn`, `error`             | ❌ No (default: warn)               |
| `NG_APP_ENABLE_CONSOLE`   | Habilitar logs en consola    | `true` o `false`                             | ❌ No (default: false)              |

---

## 💻 Desarrollo Local con API Real

### Opción 1: Usando el archivo `.env.local` (Recomendado)

```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env.local

# 2. Edita .env.local y ajusta las variables
nano .env.local

# 3. Configura la URL del backend
NG_APP_API_BASE_URL=https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net

# 4. Ejecuta el servidor de desarrollo
npm run start:real
```

### Opción 2: Variables de entorno inline

```bash
# Ejecutar con la API real usando variables inline
NG_APP_API_BASE_URL=https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net \
npm run start:real
```

### Opción 3: Usando `environment.development-real.ts`

```bash
# Ya está configurado por defecto con la URL de Azure
npm run start:real
```

### Verificar la Configuración

Una vez que la app esté corriendo, abre DevTools Console y deberías ver:

```
🔐 [TenantHeaderInterceptor] GET /api/catalog/products
  📍 URL completa: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
  🏢 Tenant Slug: tenant-demo
  🔑 Tenant Key: 12345678...
```

---

## 🌐 Despliegue en Vercel

### Paso 1: Conectar el Repositorio

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New Project"**
3. Selecciona tu repositorio de GitHub/GitLab/Bitbucket
4. Click en **"Import"**

### Paso 2: Configurar el Proyecto

En la pantalla de configuración:

**Framework Preset**: `Other` (o déjalo detectar automáticamente)

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

### Paso 3: Configurar Variables de Entorno

En **Project Settings > Environment Variables**, agrega:

#### ✅ **Para Producción** (Production)

| Name                      | Value                                                                |
| ------------------------- | -------------------------------------------------------------------- |
| `NG_APP_API_BASE_URL`     | `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net` |
| `NG_APP_ENABLE_ANALYTICS` | `true`                                                               |
| `NG_APP_LOG_LEVEL`        | `warn`                                                               |
| `NG_APP_ENABLE_CONSOLE`   | `false`                                                              |
| `NG_APP_GA_TRACKING_ID`   | `G-XXXXXXXXXX` (tu ID real)                                          |
| `NG_APP_VAPID_PUBLIC_KEY` | `BHd...` (tu clave VAPID real)                                       |

Selecciona: ☑️ **Production**

#### 🔍 **Para Preview/Desarrollo** (Preview & Development)

| Name                      | Value                                                                |
| ------------------------- | -------------------------------------------------------------------- |
| `NG_APP_API_BASE_URL`     | `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net` |
| `NG_APP_ENABLE_ANALYTICS` | `false`                                                              |
| `NG_APP_LOG_LEVEL`        | `debug`                                                              |
| `NG_APP_ENABLE_CONSOLE`   | `true`                                                               |

Selecciona: ☑️ **Preview** y ☑️ **Development**

### Paso 4: Desplegar

```bash
# Opción 1: Desde Vercel Dashboard
Click en "Deploy" → Espera a que termine el build

# Opción 2: Usando Vercel CLI
npm i -g vercel
vercel --prod
```

### Paso 5: Verificar el Despliegue

1. Abre tu URL de Vercel: `https://your-app.vercel.app`
2. Abre DevTools > Network
3. Navega a cualquier página con productos
4. Verifica que las requests vayan a:
   ```
   https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/...
   ```
5. Verifica que los headers incluyan:
   ```
   X-Tenant-Slug: tenant-demo
   X-Tenant-Key: uuid-aqui
   ```

---

## 🎯 Scripts Disponibles

| Script                 | Descripción             | Uso                                   |
| ---------------------- | ----------------------- | ------------------------------------- |
| `npm start`            | Desarrollo con mock API | Local, datos de prueba                |
| `npm run start:real`   | Desarrollo con API real | Local, datos reales del backend       |
| `npm run build:prod`   | Build de producción     | Genera `dist/` para deployment manual |
| `npm run vercel-build` | Build para Vercel       | Usado automáticamente por Vercel      |

---

## 🔧 Cómo Funciona

### 1. Script de Inyección (`scripts/inject-env-vars.js`)

Este script se ejecuta **antes del build** y:

1. Lee las variables de entorno de Vercel (`process.env`)
2. Genera un archivo `environment.runtime.ts` con los valores
3. Angular usa este archivo en lugar del hardcodeado

### 2. Configuración de Build (`apps/pwa/project.json`)

La configuración `production-vercel`:

```json
{
  "fileReplacements": [
    {
      "replace": "apps/pwa/src/environments/environment.ts",
      "with": "apps/pwa/src/environments/environment.runtime.ts"
    }
  ]
}
```

Reemplaza el environment estático con el generado dinámicamente.

### 3. Flujo en Vercel

```
1. Vercel detecta push a GitHub
   ↓
2. Lee variables de entorno configuradas
   ↓
3. Ejecuta: npm run vercel-build
   ├─ node scripts/inject-env-vars.js  (genera environment.runtime.ts)
   └─ nx build ecommerce --configuration=production-vercel
   ↓
4. Deploy de dist/apps/ecommerce/browser
```

---

## 🛠️ Troubleshooting

### ❌ Error: "API URL not found"

**Causa**: Variable `NG_APP_API_BASE_URL` no configurada

**Solución**:

```bash
# Vercel Dashboard > Project Settings > Environment Variables
# Agregar: NG_APP_API_BASE_URL = https://api-ecommerce-...
# Redeploy
```

### ❌ Headers de tenant no se agregan

**Causa**: TenantBootstrapService no pudo resolver el tenant

**Solución**:

1. Verifica que la URL incluya `?tenant=SLUG` o use un subdominio
2. Verifica que el backend `/api/public/tenant/resolve` funcione
3. Revisa los logs en DevTools Console

### ❌ Build falla en Vercel

**Causa**: Puede ser el script de inyección o dependencias

**Solución**:

```bash
# 1. Verifica que el script existe
ls scripts/inject-env-vars.js

# 2. Prueba el build localmente
npm run vercel-build

# 3. Revisa los logs de Vercel
# Vercel Dashboard > Deployments > [tu deployment] > Build Logs
```

### ❌ Variables de entorno no se aplican

**Causa**: No se seleccionó el entorno correcto (Production/Preview/Development)

**Solución**:

1. Ve a **Project Settings > Environment Variables**
2. Edita cada variable
3. Marca ☑️ **Production**, ☑️ **Preview**, ☑️ **Development**
4. **Redeploy** el proyecto

### 💡 Verificar variables inyectadas

Agrega esto temporalmente en `main.ts`:

```typescript
console.log('🔍 Environment Check:', {
  apiBaseUrl: environment.apiBaseUrl,
  production: environment.production,
  mockApi: environment.mockApi,
});
```

---

## 📚 Recursos Adicionales

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Angular Environment Configuration](https://angular.io/guide/build#configuring-application-environments)
- [Nx Build Configuration](https://nx.dev/recipes/angular/use-environment-variables-in-angular)

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs de Vercel**: Dashboard > Deployments > [deployment] > Build Logs
2. **Verifica las variables**: Project Settings > Environment Variables
3. **Prueba localmente**: `npm run vercel-build` debe funcionar sin errores
4. **Revisa el archivo generado**: `apps/pwa/src/environments/environment.runtime.ts` debe existir después del build

---

**¡Listo!** Tu PWA ahora está configurada para usar variables de entorno en Vercel. 🎉
