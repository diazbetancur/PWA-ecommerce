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
  categoryMedia: {
    maxImageSizeMb: 1,
    publicBaseUrl: 'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev',
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
