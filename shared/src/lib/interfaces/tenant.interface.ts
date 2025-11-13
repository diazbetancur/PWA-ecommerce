export interface TenantConfig {
  slug: string;
  displayName: string;
  logoUrl?: string;
  mainImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tenantKey: string; // Identificador interno para el backend
  // Configuraciones adicionales
  favicon?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  // Theme personalizado
  theme?: TenantTheme;
  // Configuraciones de negocio
  currency?: string;
  locale?: string;
  timezone?: string;
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  // Material Design color variables
  primaryVariant?: string;
  secondaryVariant?: string;
  // Custom CSS variables
  customVariables?: Record<string, string>;
}

export interface TenantApiResponse {
  success: boolean;
  data: TenantConfig;
  message?: string;
}

export interface TenantResolutionStrategy {
  type: 'query' | 'subdomain' | 'hostname' | 'default';
  value: string;
}
