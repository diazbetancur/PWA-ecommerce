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
  apiBaseUrl: 'http://localhost:5093',
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
