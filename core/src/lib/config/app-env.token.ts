import { InjectionToken } from '@angular/core';

export type AppEnvironmentName = 'local' | 'dev' | 'qa' | 'pdn';
export type AppLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppEnv {
  environmentName: AppEnvironmentName;
  production: boolean;
  apiBaseUrl: string;
  publicAssetBaseUrl?: string;
  enableServiceWorker: boolean;
  enableSSR: boolean;
  logLevel: AppLogLevel;
  featureFlags: Record<string, boolean>;
  enableConsoleLogging?: boolean;
  publicVapidKey?: string;
  categoryImageMaxSizeMb?: number;
  useTenantHeader?: boolean;
}

export const APP_ENV = new InjectionToken<AppEnv>('APP_ENV');
