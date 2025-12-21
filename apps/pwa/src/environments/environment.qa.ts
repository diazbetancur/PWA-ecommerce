import { AppEnvironment } from '@pwa/core';

/**
 * Configuración para ambiente QA (Quality Assurance)
 * - API real de QA/Staging
 * - Logging moderado
 * - Features habilitados para pruebas
 */
export const environment: AppEnvironment = {
  production: false,
  mockApi: false, // 🔥 Usar API real de QA
  apiBaseUrl:
    'https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net', // TODO: Cambiar por URL de QA cuando esté disponible
  useTenantHeader: true,
  fcm: {
    vapidPublicKey: 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY',
  },
  analytics: {
    enabled: true, // Habilitado para testing
    trackingId: undefined, // Sin tracking real en QA
  },
  logging: {
    level: 'info', // Nivel intermedio para QA
    enableConsole: true,
  },
  features: {
    advancedSearch: true,
    darkMode: true,
    notifications: true,
    analytics: true,
  },
};
