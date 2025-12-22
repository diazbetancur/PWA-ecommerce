# 🌐 Azure Backend Integration Guide

## 🏗️ Arquitectura del Sistema de Entornos

### 📋 Visión General

Hemos implementado una arquitectura robusta y escalable para manejar múltiples entornos en tu PWA Angular, con enfoque específico en la integración con tu backend de Azure.

### 🎯 Beneficios Clave

- ✅ **Type Safety**: Configuración tipada con TypeScript
- ✅ **Multiple Environments**: Development (Mock), Development (Real), Production
- ✅ **Centralized Configuration**: Un solo lugar para toda la configuración
- ✅ **Runtime Validation**: Validación automática de configuración
- ✅ **Logging Control**: Control granular del logging por entorno
- ✅ **Feature Flags**: Sistema de feature flags incluido
- ✅ **Easy Environment Switching**: Scripts NPM para cambio rápido

---

## 🔧 Configuración de Entornos

### 1. Development (Mock API) - Por defecto

```bash
npm start
```

**Configuración**: `environment.ts`

- ✅ Mock API habilitado
- ✅ Logging completo
- ✅ Todas las features habilitadas para testing

### 2. Development (Azure Real API)

```bash
npm run start:real
```

**Configuración**: `environment.development-real.ts`

- 🌐 API Real: `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net`
- ✅ Logging completo para debugging
- ✅ Features de notificaciones habilitadas

### 3. Production

```bash
npm run build:prod
```

**Configuración**: `environment.prod.ts`

- 🌐 API Real: `https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net`
- ⚠️ Logging mínimo (solo warnings y errores)
- ✅ Analytics habilitado
- ❌ Console logging deshabilitado

---

## 📁 Estructura de Archivos

```
apps/pwa/src/environments/
├── environment.ts                    # Development (Mock)
├── environment.development-real.ts   # Development (Real API)
└── environment.prod.ts              # Production

core/src/lib/
├── services/
│   ├── app-env.service.ts           # Servicio centralizado de configuración
│   └── api-client.service.ts        # Cliente HTTP mejorado
└── config/
    └── app-env-initializer.ts       # Inicializador de la app
```

---

## 🎛️ AppEnvService - Servicio Principal

### Funcionalidades Clave

```typescript
// Inyectar en cualquier componente o servicio
private readonly env = inject(AppEnvService);

// Verificar entorno
env.isProduction           // true/false
env.isDevelopment          // true/false
env.useMockApi            // true/false
env.useRealApi            // true/false

// Obtener configuraciones
env.apiBaseUrl            // URL del backend
env.useTenantHeader       // Headers de tenant
env.loggingLevel          // 'debug' | 'info' | 'warn' | 'error'
env.isConsoleLoggingEnabled  // true/false

// Feature flags
env.isFeatureEnabled('darkMode')     // true/false
env.isFeatureEnabled('notifications') // true/false

// Información de debugging
env.getEnvironmentInfo()    // Objeto con toda la info
env.validateEnvironment()   // Validar configuración
```

### Ejemplo de Uso

```typescript
@Component({...})
export class MyComponent {
  private readonly env = inject(AppEnvService);
  private readonly api = inject(ApiClientService);

  ngOnInit() {
    // Mostrar info del entorno en desarrollo
    if (this.env.isDevelopment) {
      console.log('Environment:', this.env.getEnvironmentInfo());
    }

    // Usar feature flags
    if (this.env.isFeatureEnabled('advancedSearch')) {
      this.enableAdvancedSearch();
    }

    // API call automático con la URL correcta
    this.api.get<Product[]>('/api/products').subscribe(products => {
      // El ApiClientService ya usa la URL correcta del entorno
    });
  }
}
```

---

## 🔗 ApiClientService Mejorado

### Características

- **Auto-configuration**: Usa automáticamente la configuración del entorno
- **Smart Logging**: Logging habilitado/deshabilitado según entorno
- **Type Safety**: Requests y responses tipados
- **Error Handling**: Manejo centralizado de errores
- **Tenant Integration**: Se integra con el TenantHeaderInterceptor

### Ejemplo de Uso

```typescript
// GET request tipado
this.apiClient.get<Product[]>('/api/products').subscribe((products) => {
  // products es tipado como Product[]
});

// POST con tipado completo
this.apiClient.post<OrderResponse, CreateOrderDto>('/api/orders', newOrderData).subscribe((response) => {
  // response es tipado como OrderResponse
});

// Con opciones personalizadas
this.apiClient
  .get<User>(
    '/api/user/profile',
    {
      headers: { 'Custom-Header': 'value' },
    },
    {
      enableLogging: true,
      timeout: 5000,
    }
  )
  .subscribe((user) => {
    // Configuración personalizada aplicada
  });
```

---

## 🚀 Comandos de NPM Actualizados

```json
{
  "scripts": {
    "start": "nx serve ecommerce", // Development (Mock)
    "start:real": "nx serve ecommerce --configuration=development-real", // Development (Real API)
    "start:prod": "nx serve ecommerce --configuration=production", // Production local
    "build": "nx build ecommerce", // Build development
    "build:real": "nx build ecommerce --configuration=development-real", // Build dev-real
    "build:prod": "nx build ecommerce --configuration=production", // Build production
    "build:prod:browser": "nx build ecommerce --configuration=production-browser" // Browser build
  }
}
```

---

## 🔧 Configuración Específica por Entorno

### Environment Interface

```typescript
export interface AppEnvironment {
  production: boolean;
  mockApi: boolean;
  apiBaseUrl: string;
  useTenantHeader: boolean;
  fcm: {
    vapidPublicKey: string;
  };
  analytics?: {
    enabled: boolean;
    trackingId?: string;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };
  features?: {
    [key: string]: boolean;
  };
}
```

### Development (Real API) - Tu caso de uso principal

```typescript
export const environment: AppEnvironment = {
  production: false,
  mockApi: false, // 🔥 API real habilitado
  apiBaseUrl: 'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net',
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  },
  logging: {
    level: 'debug', // Full logging para desarrollo
    enableConsole: true,
  },
  features: {
    advancedSearch: true,
    darkMode: true,
    notifications: true, // Habilitado para probar con backend real
    analytics: false,
  },
};
```

---

## 🧪 Componente de Demo

Incluimos un componente de demostración completo que puedes usar para:

- ✅ Verificar la configuración actual del entorno
- ✅ Probar la conexión con el API
- ✅ Ver todas las feature flags activas
- ✅ Cambiar entre entornos fácilmente

### Usar el Demo Component

```typescript
// En cualquier ruta o página
import { EnvironmentDemoComponent } from '@shared/demos/environment-demo.component';

@Component({
  imports: [EnvironmentDemoComponent],
  template: '<app-environment-demo />',
})
export class MyPageComponent {}
```

---

## 🔍 Debugging y Troubleshooting

### 1. Verificar Configuración Actual

```typescript
// En cualquier componente
private readonly env = inject(AppEnvService);

ngOnInit() {
  // Ver toda la configuración
  console.log('Environment Info:', this.env.getEnvironmentInfo());

  // Validar configuración
  const validation = this.env.validateEnvironment();
  if (!validation.isValid) {
    console.error('Environment Errors:', validation.errors);
  }
}
```

### 2. Testing de API Endpoints

```typescript
// Test básico de conectividad
this.apiClient.get('/health').subscribe({
  next: (response) => console.log('✅ API Connected:', response),
  error: (error) => console.error('❌ API Error:', error),
});
```

### 3. Verificar Headers de Tenant

El sistema automáticamente incluye headers de tenant si `useTenantHeader: true`. Puedes verificar esto en las DevTools del navegador en la pestaña Network.

---

## 🚀 Próximos Pasos

### 1. Configurar FCM (Firebase Cloud Messaging)

```typescript
// Reemplazar en todos los environments
fcm: {
  vapidPublicKey: 'TU_VAPID_KEY_REAL';
}
```

### 2. Configurar Analytics (Solo Production)

```typescript
// En environment.prod.ts
analytics: {
  enabled: true,
  trackingId: 'TU_GOOGLE_ANALYTICS_ID'
}
```

### 3. Personalizar Feature Flags

```typescript
// Añadir nuevas features según tus necesidades
features: {
  advancedSearch: true,
  darkMode: true,
  notifications: true,
  newCheckoutFlow: false,  // Nueva feature en desarrollo
  betaFeatures: true       // Solo para ciertos entornos
}
```

### 4. Configurar CORS en Azure

Asegúrate de que tu backend de Azure permita requests desde tu dominio:

```javascript
// Dominios permitidos
const allowedOrigins = [
  'http://localhost:4200', // Development
  'https://tu-dominio.com', // Production
  'https://preview-*.vercel.app', // Vercel previews
];
```

---

## 💡 Mejores Prácticas

### 1. Usar el AppEnvService siempre

```typescript
// ✅ Correcto
private readonly env = inject(AppEnvService);
const apiUrl = this.env.apiBaseUrl;

// ❌ Evitar
import { environment } from '../environments/environment';
const apiUrl = environment.apiBaseUrl;
```

### 2. Feature Flags para nuevas funcionalidades

```typescript
// ✅ Usar feature flags para código experimental
if (this.env.isFeatureEnabled('newFeature')) {
  this.enableNewFeature();
}
```

### 3. Logging condicionado

```typescript
// ✅ Usar el sistema de logging del entorno
if (this.env.isConsoleLoggingEnabled) {
  console.log('Debug info only in development');
}
```

---

## 🎉 Resultado Final

Con esta configuración tienes:

- ✅ **Desarrollo rápido** con Mock API (`npm start`)
- ✅ **Testing real** con Azure backend (`npm run start:real`)
- ✅ **Producción optimizada** con configuración específica
- ✅ **Type safety** en toda la configuración
- ✅ **Debugging fácil** con logging controlado
- ✅ **Flexibilidad** para nuevos entornos o features

¡Tu PWA ya está lista para usar el backend real de Azure manteniendo toda la flexibilidad para development y testing! 🚀
