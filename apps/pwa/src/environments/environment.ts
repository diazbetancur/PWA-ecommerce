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
