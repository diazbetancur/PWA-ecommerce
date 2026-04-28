import { AppEnvironment } from '@pwa/core';

/**
 * Configuración para ambiente QA (Quality Assurance)
 * - API real de QA/Staging
 * - Logging moderado
 * - Features habilitados para pruebas
 */
export const environment: AppEnvironment = {
  environmentName: 'qa',
  production: false,
  apiBaseUrl:
    'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net', // TODO: Cambiar por URL de QA cuando esté disponible
  publicAssetBaseUrl: 'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev',
  enableServiceWorker: true,
  enableSSR: false,
  logLevel: 'info',
  featureFlags: {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: true,
  },
  enableConsoleLogging: true,
  publicVapidKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  categoryImageMaxSizeMb: 1,
  useTenantHeader: true,
};
