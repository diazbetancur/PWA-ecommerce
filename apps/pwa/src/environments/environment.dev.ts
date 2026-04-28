import { AppEnvironment } from '@pwa/core';

/**
 * Configuración para ambiente DEV (Development con API real)
 * - API real de desarrollo
 * - Full logging
 * - Features habilitados para desarrollo
 */
export const environment: AppEnvironment = {
  environmentName: 'dev',
  production: false,
  apiBaseUrl: 'http://localhost:5093',
  publicAssetBaseUrl: 'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev',
  enableServiceWorker: false,
  enableSSR: false,
  logLevel: 'debug',
  featureFlags: {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: false,
  },
  enableConsoleLogging: true,
  publicVapidKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  categoryImageMaxSizeMb: 1,
  useTenantHeader: true,
};
