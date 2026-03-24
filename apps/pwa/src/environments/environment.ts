import { AppEnvironment } from '@pwa/core';

export const environment: AppEnvironment = {
  production: false,
  mockApi: true,
  apiBaseUrl:
    'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net',
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  },
  categoryMedia: {
    maxImageSizeMb: 1,
    publicBaseUrl: 'https://pub-49f57cb38af14e108e2f36fb4f0dc058.r2.dev',
  },
  analytics: {
    enabled: false,
    trackingId: undefined,
  },
  logging: {
    level: 'debug',
    enableConsole: true,
  },
  features: {
    advancedSearch: true,
    darkMode: true,
    notifications: false,
    analytics: false,
  },
};
