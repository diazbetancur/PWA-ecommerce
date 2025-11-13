import { TenantConfig } from '@pwa/core';

/**
 * Configuraciones de ejemplo para diferentes tenants
 * Estas configuraciones normalmente vendrían del backend
 */
export const TENANT_CONFIGS: Record<string, TenantConfig> = {
  'demo-a': {
    tenant: {
      id: 'tenant-a-uuid',
      slug: 'demo-a',
      displayName: 'TechStore Pro',
      description: 'La mejor tienda de tecnología con productos innovadores y soporte especializado.',
      contact: {
        email: 'contacto@techstore-pro.com',
        phone: '+1 (555) 123-4567',
        address: '123 Tech Street, Silicon Valley, CA 94025'
      },
      socialLinks: {
        facebook: 'https://facebook.com/techstore-pro',
        twitter: 'https://twitter.com/techstore_pro',
        instagram: 'https://instagram.com/techstore.pro'
      },
      branding: {
        primaryColor: '#2563eb',      // Blue
        secondaryColor: '#475569',    // Slate
        accentColor: '#dc2626',       // Red
        backgroundColor: '#ffffff',   // White
        textColor: '#1e293b',         // Dark slate
        logoUrl: 'https://cdn.techstore-pro.com/assets/logo.svg',
        headerLogo: 'https://cdn.techstore-pro.com/assets/header-logo.svg',
        footerLogo: 'https://cdn.techstore-pro.com/assets/footer-logo-white.svg',
        faviconUrl: 'https://cdn.techstore-pro.com/assets/favicon.ico'
      }
    },
    theme: {
      primary: '#2563eb',
      accent: '#dc2626',
      logoUrl: 'https://cdn.techstore-pro.com/assets/logo.svg',
      background: '#ffffff',
      textColor: '#1e293b',
      enableDark: true,
      cssVars: {
        '--border-radius': '8px',
        '--font-family': 'Inter, system-ui, sans-serif',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }
    },
    features: {
      cart: true,
      wishlist: true,
      reviews: true,
      chat: true,
      multiLanguage: true,
      darkMode: true,
      notifications: true
    },
    limits: {
      products: 10000,
      admins: 50,
      storageMB: 5120 // 5GB
    },
    locale: 'es-ES',
    currency: 'EUR',
    cdnBaseUrl: 'https://cdn.techstore-pro.com'
  },

  'demo-b': {
    tenant: {
      id: 'tenant-b-uuid',
      slug: 'demo-b',
      displayName: 'Fashion World',
      description: 'Moda exclusiva y tendencias de temporada con envíos gratis en pedidos superiores a 50€.',
      contact: {
        email: 'hola@fashion-world.es',
        phone: '+34 912 345 678',
        address: 'Calle Gran Vía 28, 28013 Madrid, España'
      },
      socialLinks: {
        facebook: 'https://facebook.com/fashionworld.es',
        twitter: 'https://twitter.com/fashionworld_es',
        instagram: 'https://instagram.com/fashionworld.es',
        linkedin: 'https://linkedin.com/company/fashionworld'
      },
      branding: {
        primaryColor: '#ec4899',      // Pink
        secondaryColor: '#6b7280',    // Gray
        accentColor: '#f59e0b',       // Amber
        backgroundColor: '#fef7ff',   // Light pink
        textColor: '#374151',         // Gray
        logoUrl: 'https://cdn.fashion-world.es/assets/logo.svg',
        headerLogo: 'https://cdn.fashion-world.es/assets/header-logo.svg',
        footerLogo: 'https://cdn.fashion-world.es/assets/footer-logo.svg',
        faviconUrl: 'https://cdn.fashion-world.es/assets/favicon.ico'
      }
    },
    theme: {
      primary: '#ec4899',
      accent: '#f59e0b',
      logoUrl: 'https://cdn.fashion-world.es/assets/logo.svg',
      background: '#fef7ff',
      textColor: '#374151',
      enableDark: false,
      cssVars: {
        '--border-radius': '12px',
        '--font-family': 'Poppins, system-ui, sans-serif',
        '--shadow-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    },
    features: {
      cart: true,
      wishlist: true,
      reviews: true,
      chat: false,
      multiLanguage: false,
      darkMode: false,
      notifications: true
    },
    limits: {
      products: 5000,
      admins: 25,
      storageMB: 2560 // 2.5GB
    },
    locale: 'es-ES',
    currency: 'EUR',
    cdnBaseUrl: 'https://cdn.fashion-world.es'
  },

  'demo-c': {
    tenant: {
      id: 'tenant-c-uuid',
      slug: 'demo-c',
      displayName: 'Green Garden',
      description: 'Todo para tu jardín: plantas, herramientas y consejos de expertos para crear espacios verdes únicos.',
      contact: {
        email: 'info@green-garden.com',
        phone: '+1 (555) 987-6543'
      },
      socialLinks: {
        instagram: 'https://instagram.com/green.garden.co',
        facebook: 'https://facebook.com/greengarden.co'
      },
      branding: {
        primaryColor: '#059669',      // Green
        secondaryColor: '#78716c',    // Stone
        accentColor: '#ea580c',       // Orange
        backgroundColor: '#f0fdf4',   // Light green
        textColor: '#1c1917',         // Dark stone
        logoUrl: 'https://cdn.green-garden.com/assets/logo.svg'
      }
    },
    theme: {
      primary: '#059669',
      accent: '#ea580c',
      logoUrl: 'https://cdn.green-garden.com/assets/logo.svg',
      background: '#f0fdf4',
      textColor: '#1c1917',
      enableDark: true
    },
    features: {
      cart: true,
      wishlist: false,
      reviews: true,
      chat: true,
      multiLanguage: false,
      darkMode: true,
      notifications: false
    },
    limits: {
      products: 2000,
      admins: 10,
      storageMB: 1024 // 1GB
    },
    locale: 'en-US',
    currency: 'USD',
    cdnBaseUrl: 'https://cdn.green-garden.com'
  }
};

/**
 * Función para simular la carga de configuración desde el backend
 */
export async function loadTenantConfig(slug: string): Promise<TenantConfig | null> {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));

  const config = TENANT_CONFIGS[slug];
  if (!config) {
    throw new Error(`Tenant configuration not found for slug: ${slug}`);
  }

  return config;
}

/**
 * URLs de ejemplo para probar diferentes tenants:
 *
 * Tenant A (TechStore Pro):
 * - http://localhost:4200?tenant=demo-a
 * - http://demo-a.localhost:4200
 *
 * Tenant B (Fashion World):
 * - http://localhost:4200?tenant=demo-b
 * - http://demo-b.localhost:4200
 *
 * Tenant C (Green Garden):
 * - http://localhost:4200?tenant=demo-c
 * - http://demo-c.localhost:4200
 */
