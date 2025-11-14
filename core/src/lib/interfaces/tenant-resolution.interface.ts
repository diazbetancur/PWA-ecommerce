/**
 * Interfaces para la resolución de tenants desde el backend real
 */

/**
 * ✅ ALINEADO CON API DOCUMENTATION v1
 * Respuesta del endpoint GET /public/tenant-config
 * Header requerido: X-Tenant-Slug
 *
 * Ejemplo de respuesta:
 * {
 *   "name": "My Awesome Store",
 *   "slug": "my-store",
 *   "theme": {},
 *   "seo": {},
 *   "features": ["catalog", "cart", "checkout", "guest_checkout", "categories"]
 * }
 */
export interface PublicTenantConfigResponse {
  name: string; // Store name
  slug: string; // Store slug
  theme: Record<string, any>; // Theme configuration (empty for now)
  seo: Record<string, any>; // SEO metadata (empty for now)
  features: string[]; // List of enabled feature codes
}

/**
 * ⚠️ LEGACY INTERFACE - To be deprecated
 * Esta interfaz representa una estructura más completa que podría usarse
 * en endpoints futuros o internos del backend.
 * NO coincide con /public/tenant-config actual.
 */
export interface TenantConfigResponse {
  /** Información básica del tenant */
  tenant: {
    /** ID único del tenant (UUID o similar) */
    id: string;
    /** Slug único del tenant para URLs y referencias */
    slug: string;
    /** Nombre para mostrar en la UI */
    displayName: string;
    /** Descripción del tenant (opcional) */
    description?: string;
    /** Estado actual del tenant */
    status: 'active' | 'inactive' | 'suspended' | 'trial';
    /** Fecha de creación */
    createdAt?: string;
    /** Última actualización */
    updatedAt?: string;
    /** Información de contacto */
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  };

  /** Configuración visual y branding */
  branding: {
    /** URL del logo principal */
    logoUrl?: string;
    /** URL de la imagen principal/banner */
    mainImageUrl?: string;
    /** Color primario (hex) */
    primaryColor: string;
    /** Color secundario (hex) */
    secondaryColor: string;
    /** Color de acento (hex) */
    accentColor?: string;
    /** URL del favicon */
    faviconUrl?: string;
    /** Color de fondo */
    backgroundColor?: string;
    /** Color de texto */
    textColor?: string;
    /** CSS personalizado */
    customCss?: string;
  };

  /** Configuración regional e internacionalización */
  localization: {
    /** Código de moneda ISO 4217 (USD, EUR, COP, MXN, etc.) */
    currency: string;
    /** Código de locale BCP 47 (en-US, es-CO, es-MX, etc.) */
    locale: string;
    /** Zona horaria IANA (America/Bogota, America/New_York, etc.) */
    timezone?: string;
    /** Formato de fecha personalizado */
    dateFormat?: string;
    /** Formato de números personalizado */
    numberFormat?: string;
    /** Idiomas soportados */
    supportedLanguages?: string[];
    /** Idioma por defecto */
    defaultLanguage?: string;
  };

  /** Features y capacidades del tenant */
  features: {
    /** Límite de productos */
    maxProducts?: number;
    /** Límite de administradores */
    maxAdmins?: number;
    /** Límite de almacenamiento en MB */
    storageLimitMB?: number;
    /** Analytics habilitado */
    analyticsEnabled: boolean;
    /** Dominio personalizado habilitado */
    customDomainEnabled: boolean;
    /** SSO habilitado */
    ssoEnabled: boolean;
    /** Acceso a API habilitado */
    apiAccessEnabled: boolean;
    /** Múltiples idiomas habilitado */
    multiLanguageEnabled: boolean;
    /** Notificaciones push habilitadas */
    pushNotificationsEnabled?: boolean;
    /** Exportación de datos habilitada */
    dataExportEnabled?: boolean;
  };

  /** Plan de suscripción (opcional) */
  plan?: {
    /** ID del plan */
    id: string;
    /** Nombre del plan */
    name: string;
    /** Tier/nivel del plan */
    tier: 'free' | 'basic' | 'pro' | 'enterprise' | 'custom';
    /** Ciclo de facturación */
    billingCycle?: 'monthly' | 'yearly' | 'lifetime';
    /** Fecha de expiración */
    expiresAt?: string;
  };

  /** Configuraciones de negocio */
  settings?: {
    /** Modo mantenimiento activo */
    maintenanceMode: boolean;
    /** Registro público habilitado */
    publicSignupEnabled: boolean;
    /** Checkout como invitado habilitado */
    guestCheckoutEnabled: boolean;
    /** Seguimiento de inventario */
    inventoryTracking: boolean;
    /** Cálculo de impuestos habilitado */
    taxCalculationEnabled: boolean;
    /** Envíos habilitados */
    shippingEnabled: boolean;
    /** Reseñas de productos habilitadas */
    productReviewsEnabled?: boolean;
    /** Wishlist habilitado */
    wishlistEnabled?: boolean;
  };

  /** Metadata de la respuesta */
  meta?: {
    /** Estrategia de resolución usada */
    resolvedBy: 'hostname' | 'subdomain' | 'query' | 'default';
    /** Valor usado para resolver */
    resolvedFrom: string;
    /** Fecha hasta la cual cachear */
    cacheUntil?: string;
    /** Última actualización de configuración */
    lastUpdated?: string;
    /** Versión de la configuración */
    version?: string;
    /** Información del servidor */
    server?: string;
  };
}

/**
 * Request para resolver tenant
 */
export interface TenantResolveRequest {
  /** Slug del tenant a resolver */
  tenant?: string;
  /** Hostname del request (opcional, se detecta automáticamente) */
  hostname?: string;
  /** Incluir configuración extendida */
  extended?: boolean;
}

/**
 * Estados del proceso de resolución de tenant
 */
export type TenantResolutionStatus =
  | 'idle' // No ha comenzado
  | 'resolving' // Resolviendo tenant
  | 'resolved' // Tenant resuelto exitosamente
  | 'not-found' // Tenant no encontrado
  | 'error' // Error en la resolución
  | 'timeout'; // Timeout en la resolución

/**
 * Información de error detallada
 */
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

/**
 * Estrategia de resolución de tenant
 */
export interface TenantResolutionStrategy {
  type: 'query' | 'subdomain' | 'hostname' | 'path' | 'default';
  value: string;
  source: string; // De dónde se obtuvo el valor
  priority: number; // 1 = más alta prioridad
}

/**
 * Configuración para el TenantBootstrapService
 */
export interface TenantBootstrapConfig {
  /** Slug por defecto si no se puede resolver */
  defaultTenantSlug: string;
  /** Timeout para la resolución en ms */
  resolutionTimeout: number;
  /** Número de reintentos en caso de error */
  maxRetries: number;
  /** Habilitar cache del tenant */
  enableCache: boolean;
  /** TTL del cache en ms */
  cacheTTL: number;
  /** Estrategias de resolución habilitadas */
  enabledStrategies: TenantResolutionStrategy['type'][];
  /** Redirigir a página de error si no se encuentra */
  redirectOnNotFound: boolean;
  /** URL de redirección en caso de error */
  errorRedirectUrl: string;
}

/**
 * Resultado de la resolución de tenant
 */
export interface TenantResolutionResult {
  success: boolean;
  tenant?: TenantConfigResponse;
  strategy?: TenantResolutionStrategy;
  error?: TenantResolutionError;
  duration: number; // Tiempo de resolución en ms
  cached: boolean; // Si el resultado vino del cache
}
