import { AppEnvironment } from '@core/services/app-env.service';

/**
 * Configuración para producción con API real de Azure
 */
export const environment: AppEnvironment = {
  production: true,
  mockApi: false,  // 🔥 Siempre API real en producción
  apiBaseUrl: 'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net',
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY'
  },
  analytics: {
    enabled: true,   // Habilitado en producción
    trackingId: 'GA_TRACKING_ID_HERE'  // Reemplazar con tu GA ID
  },
  logging: {
    level: 'warn',    // Solo warnings y errors en producción
    enableConsole: false  // Sin console.log en producción
  },
  features: {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: true   // Analytics habilitado en producción
  }
};
