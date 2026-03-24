import { InjectionToken } from '@angular/core';

export interface AppEnv {
  production: boolean;
  mockApi: boolean;
  apiBaseUrl: string;
  useTenantHeader: boolean;
  fcm: { vapidPublicKey: string };
  categoryMedia?: {
    maxImageSizeMb?: number;
    publicBaseUrl?: string;
  };
}

export const APP_ENV = new InjectionToken<AppEnv>('APP_ENV');
