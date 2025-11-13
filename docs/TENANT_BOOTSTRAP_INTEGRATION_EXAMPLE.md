/**
 * 📋 EJEMPLO DE INTEGRACIÓN CON BACKEND REAL DE AZURE
 * 
 * Este archivo muestra cómo configurar correctamente el TenantBootstrapService
 * para conectarse al backend de Azure y cargar la configuración del tenant.
 * 
 * URL del Backend: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
 * Endpoint: GET /api/public/tenant/resolve?tenant={slug}
 */

import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

// Core providers de PWA
import {
  APP_ENV,
  TENANT_APP_INITIALIZER,
  authTenantInterceptor,
} from '@pwa/core';

import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

/**
 * 🔧 Configuración de la Aplicación
 * 
 * ORDEN IMPORTANTE de los providers:
 * 1. Zona y configuración base
 * 2. Router
 * 3. HTTP Client con interceptors
 * 4. Entorno (APP_ENV)
 * 5. TENANT_APP_INITIALIZER (necesita Router y HttpClient)
 * 6. Resto de providers
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // 1️⃣ Configuración base de Angular
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(withEventReplay()),

    // 2️⃣ Router (necesario ANTES del tenant initializer)
    provideRouter(appRoutes),

    // 3️⃣ HTTP Client con interceptor de tenant
    // El interceptor agrega automáticamente headers X-Tenant-Slug y X-Tenant-Key
    provideHttpClient(
      withFetch(),
      withInterceptors([authTenantInterceptor])
    ),

    // 4️⃣ Configuración del entorno
    // Aquí se define apiBaseUrl que usa ApiClientService
    { 
      provide: APP_ENV, 
      useValue: environment 
    },

    // 5️⃣ 🚀 TENANT_APP_INITIALIZER - ¡CORE DEL SISTEMA!
    // Este provider:
    // - Se ejecuta ANTES de que Angular inicialice la app
    // - Llama al backend: GET /api/public/tenant/resolve?tenant={slug}
    // - Carga configuración del tenant (branding, theme, features, etc.)
    // - Redirige a /tenant/not-found si el tenant no existe
    // - Aplica CSS variables y meta tags del tenant
    TENANT_APP_INITIALIZER,

    // 6️⃣ Service Worker para PWA
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // 7️⃣ Otros providers de la aplicación
    // Transloco, Auth, etc.
  ],
};

/**
 * 📝 NOTAS IMPORTANTES:
 * 
 * 1. **Configuración del Backend**:
 *    - El apiBaseUrl se define en `environment.ts`:
 *      ```typescript
 *      export const environment = {
 *        production: false,
 *        mockApi: false,  // ✅ false para usar backend real
 *        apiBaseUrl: 'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net',
 *        // ...
 *      };
 *      ```
 * 
 * 2. **Resolución de Tenant**:
 *    - El TenantBootstrapService resuelve el slug en este orden:
 *      1. Query parameter: `?tenant=demo-a`
 *      2. Subdomain: `demo-a.midominio.com`
 *      3. Hostname mapping: dominios personalizados
 *      4. Default: `demo-a` (configurado en el servicio)
 * 
 * 3. **URL Completa Construida**:
 *    - ApiClientService construye automáticamente:
 *      `${apiBaseUrl}/api/public/tenant/resolve?tenant=${slug}`
 *    - Ejemplo final:
 *      `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/public/tenant/resolve?tenant=demo-a`
 * 
 * 4. **Manejo de Errores**:
 *    - Si el tenant no existe (404): Redirige a `/tenant/not-found`
 *    - Si hay error de red: Redirige a `/tenant/not-found` con flag retryable=true
 *    - Si hay timeout: Usa configuración por defecto y muestra error
 * 
 * 5. **Estado del Tenant**:
 *    - Puedes verificar el estado en cualquier componente:
 *      ```typescript
 *      const tenantBootstrap = inject(TenantBootstrapService);
 *      
 *      if (tenantBootstrap.hasErrorState()) {
 *        console.log('Error:', tenantBootstrap.error());
 *      }
 *      
 *      if (tenantBootstrap.isReady()) {
 *        const config = tenantBootstrap.getTenantConfig();
 *        console.log('Tenant:', config.tenant.displayName);
 *      }
 *      ```
 * 
 * 6. **Debugging**:
 *    - Revisa la consola del navegador para logs detallados
 *    - Usa `tenantBootstrap.getDebugInfo()` para ver toda la información
 *    - Visita `/tenant/debug` para un panel de debugging completo
 */

/**
 * 🧪 TESTING
 * 
 * Para probar diferentes tenants:
 * 
 * 1. Por Query Parameter:
 *    - http://localhost:4200?tenant=demo-a
 *    - http://localhost:4200?tenant=demo-b
 *    - http://localhost:4200?tenant=demo-c
 * 
 * 2. Por Subdomain (requiere configuración de DNS/hosts):
 *    - http://demo-a.localhost:4200
 *    - http://demo-b.localhost:4200
 * 
 * 3. Tenant No Existente (para probar error):
 *    - http://localhost:4200?tenant=non-existent
 *    - Debería redirigir a: /tenant/not-found?slug=non-existent&code=NOT_FOUND
 * 
 * 4. Con Backend Real:
 *    - Ejecuta: `npm run start:real`
 *    - Verifica que environment.mockApi = false
 *    - Abre: http://localhost:4200?tenant=demo-a
 *    - Observa la consola para ver la llamada al backend
 */

/**
 * 🔐 HEADERS AUTOMÁTICOS
 * 
 * Una vez que el tenant se carga, TODAS las requests HTTP incluyen automáticamente:
 * 
 * ```
 * X-Tenant-Slug: demo-a
 * X-Tenant-Key: {tenant-id-uuid}
 * ```
 * 
 * Esto lo hace el `authTenantInterceptor` automáticamente.
 * No necesitas agregar estos headers manualmente en ningún servicio.
 * 
 * Ejemplo de request resultante:
 * ```
 * GET https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
 * Headers:
 *   X-Tenant-Slug: demo-a
 *   X-Tenant-Key: abc-123-uuid
 *   Content-Type: application/json
 * ```
 */

/**
 * 🎨 CSS VARIABLES APLICADAS
 * 
 * Después de cargar el tenant, estas CSS variables están disponibles:
 * 
 * ```css
 * :root {
 *   --tenant-primary-color: #2563eb;
 *   --tenant-accent-color: #dc2626;
 *   --tenant-background-color: #ffffff;
 *   --tenant-text-color: #1e293b;
 *   --tenant-secondary-color: #475569;
 *   --tenant-main-image-url: url(...);
 *   --mat-sys-primary: #2563eb;
 *   --mat-sys-secondary: #dc2626;
 * }
 * ```
 * 
 * Puedes usarlas en tus componentes SCSS:
 * ```scss
 * .my-component {
 *   background-color: var(--tenant-primary-color);
 *   color: var(--tenant-text-color);
 * }
 * ```
 */

/**
 * 📦 RESPUESTA DEL BACKEND
 * 
 * El backend debe devolver una estructura como esta:
 * 
 * ```json
 * {
 *   "tenant": {
 *     "id": "abc-123-uuid",
 *     "slug": "demo-a",
 *     "displayName": "TechStore Pro",
 *     "description": "La mejor tienda de tecnología",
 *     "status": "active",
 *     "contact": {
 *       "email": "contacto@techstore.com",
 *       "phone": "+1 555-1234"
 *     }
 *   },
 *   "branding": {
 *     "logoUrl": "https://cdn.example.com/logo.svg",
 *     "mainImageUrl": "https://cdn.example.com/banner.jpg",
 *     "primaryColor": "#2563eb",
 *     "secondaryColor": "#475569",
 *     "accentColor": "#dc2626",
 *     "faviconUrl": "https://cdn.example.com/favicon.ico",
 *     "backgroundColor": "#ffffff",
 *     "textColor": "#1e293b"
 *   },
 *   "localization": {
 *     "currency": "USD",
 *     "locale": "en-US",
 *     "timezone": "America/New_York"
 *   },
 *   "features": {
 *     "maxProducts": 1000,
 *     "maxAdmins": 5,
 *     "storageLimitMB": 500,
 *     "analyticsEnabled": true,
 *     "customDomainEnabled": false,
 *     "ssoEnabled": false,
 *     "apiAccessEnabled": true,
 *     "multiLanguageEnabled": true
 *   },
 *   "settings": {
 *     "maintenanceMode": false,
 *     "publicSignupEnabled": true,
 *     "guestCheckoutEnabled": true,
 *     "inventoryTracking": true,
 *     "taxCalculationEnabled": true,
 *     "shippingEnabled": true
 *   }
 * }
 * ```
 */
