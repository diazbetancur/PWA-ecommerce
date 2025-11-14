import { TenantConfig } from '../models/types';

/**
 * Configuración por defecto cuando no se puede resolver un tenant
 * Se usa principalmente para páginas de login/registro y errores
 */
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  tenant: {
    id: 'default',
    slug: 'default',
    displayName: 'eCommerce Platform',
    description: 'Plataforma de comercio electrónico multi-tenant',
    contact: {
      email: 'soporte@ecommerce.com',
      phone: '+57 300 123 4567',
    },
    branding: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#ec4899',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      logoUrl: '/assets/images/default-logo.png',
    },
  },
  theme: {
    primary: '#6366f1',
    accent: '#ec4899',
    logoUrl: '/assets/images/default-logo.png',
    enableDark: false,
    background: '#ffffff',
    textColor: '#1f2937',
  },
  features: {
    enableCart: true,
    enableWishlist: true,
    enableReviews: true,
    enableChat: false,
  },
  limits: {
    products: 1000,
    admins: 10,
    storageMB: 5000,
  },
  locale: 'es-CO',
  currency: 'COP',
  cdnBaseUrl: '',
  seo: {
    title: 'eCommerce Platform',
    description: 'Plataforma de comercio electrónico multi-tenant',
    keywords: 'ecommerce, tienda online, multi-tenant',
  },
};
