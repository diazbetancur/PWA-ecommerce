import { AppEnvironment } from '@pwa/core';

/**
 * Configuración para ambiente DEV (Development con API real)
 * - API real de desarrollo
 * - Full logging
 * - Features habilitados para desarrollo
 */
export const environment: AppEnvironment = {
  production: false,
  mockApi: false, // 🔥 Usar API real
  apiBaseUrl:
    'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net',
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  },
  analytics: {
    enabled: false, // Deshabilitado en development
    trackingId: undefined,
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
