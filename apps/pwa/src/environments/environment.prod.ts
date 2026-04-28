import { AppEnvironment } from '@pwa/core';

/**
 * Configuración para producción con API real de Azure
 */
export const environment: AppEnvironment = {
  environmentName: 'pdn',
  production: true,
  apiBaseUrl:
    'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net',
  publicAssetBaseUrl: 'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev',
  enableServiceWorker: true,
  enableSSR: false,
  logLevel: 'warn',
  featureFlags: {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: true,
  },
  enableConsoleLogging: false,
  publicVapidKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  categoryImageMaxSizeMb: 1,
  useTenantHeader: true,
};
