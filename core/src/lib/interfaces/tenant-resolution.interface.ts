import {
  BrandingConfig,
  TenantContact,
  TenantSeo,
  TenantSocial,
  ThemeConfig,
} from '../models/types';

export interface PublicTenantConfigResponse {
  tenant: {
    id: string;
    slug: string;
    displayName: string;
    status?: string;
    plan?: string;
    branding?: BrandingConfig;
  };
  locale: string;
  currency: string;
  currencySymbol?: string;
  taxRate?: number;
  theme: ThemeConfig;
  features: Record<string, boolean>;
  appFeatures?: Record<string, boolean>;
  contact?: TenantContact;
  social?: TenantSocial;
  seo?: TenantSeo;
  messages?: Record<string, string>;
}

export type TenantResolutionStatus =
  | 'idle'
  | 'resolving'
  | 'resolved'
  | 'not-found'
  | 'error'
  | 'timeout';

export interface TenantResolutionError {
  code:
    | 'NOT_FOUND'
    | 'NETWORK_ERROR'
    | 'INVALID_CONFIG'
    | 'TIMEOUT'
    | 'UNAUTHORIZED'
    | 'UNKNOWN';
  message: string;
  slug?: string;
  hostname?: string;
  statusCode?: number;
  timestamp: Date;
  retryable: boolean;
  details?: unknown;
}

export interface TenantResolutionStrategy {
  type: 'query' | 'subdomain' | 'hostname' | 'path' | 'default';
  value: string;
  source: string;
  priority: number;
}

export interface TenantBootstrapConfig {
  defaultTenantSlug: string;
  resolutionTimeout: number;
  maxRetries: number;
  enableCache: boolean;
  cacheTTL: number;
  enabledStrategies: TenantResolutionStrategy['type'][];
  redirectOnNotFound: boolean;
  errorRedirectUrl: string;
}
