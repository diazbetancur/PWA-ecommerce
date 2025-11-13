import { AppEnvironment } from '@core/services/app-env.service';

export const environment: AppEnvironment = {
  production: false,
  mockApi: true,
  apiBaseUrl: 'http://localhost:5200',
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY'
  },
  analytics: {
    enabled: false,
    trackingId: undefined
  },
  logging: {
    level: 'debug',
    enableConsole: true
  },
  features: {
    advancedSearch: true,
    darkMode: true,
    notifications: false,
    analytics: false
  }
};
