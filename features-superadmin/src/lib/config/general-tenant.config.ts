/**
 * 🌍 Configuración del Tenant General (Superadmin)
 *
 * Esta configuración se usa cuando NO hay un tenant específico resuelto.
 * Representa el contexto administrativo global para la gestión de todos los tenants.
 */

export const GENERAL_TENANT_CONFIG = {
  /**
   * Identificador del tenant general
   */
  slug: 'general-admin',

  /**
   * Nombre visible
   */
  displayName: 'Administrador General',

  /**
   * Descripción
   */
  description: 'Panel de administración para gestión de todos los tenants',

  /**
   * Flag que identifica este contexto como el tenant general
   */
  isGeneralTenant: true,

  /**
   * Tema visual del admin
   */
  theme: {
    primary: '#1e293b', // Slate dark
    accent: '#3b82f6', // Blue
    logoUrl: '/assets/admin-logo.svg',
    faviconUrl: '/assets/admin-favicon.ico',
  },

  /**
   * Features habilitadas en el admin
   */
  features: {
    tenantManagement: true,
    userManagement: true,
    subscriptionManagement: true,
    systemConfiguration: true,
    analytics: true,
    billing: true,
  },
} as const;

/**
 * Tipo derivado de la configuración
 */
export type GeneralTenantConfig = typeof GENERAL_TENANT_CONFIG;
