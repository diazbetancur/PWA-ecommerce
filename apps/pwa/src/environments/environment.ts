import { AppEnvironment } from '@pwa/core';

export const environment: AppEnvironment = {
  environmentName: 'local',
  production: false,
  apiBaseUrl: 'http://localhost:5093',
  publicAssetBaseUrl: 'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev',
  enableServiceWorker: false,
  enableSSR: false,
  logLevel: 'debug',
  featureFlags: {
    advancedSearch: true,
    darkMode: true,
    notifications: false,
    analytics: false,
  },
  enableConsoleLogging: true,
  publicVapidKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  categoryImageMaxSizeMb: 1,
  useTenantHeader: true,
};
