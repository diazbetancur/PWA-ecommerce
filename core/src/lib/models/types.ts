export interface TenantInfo {
  id: string;
  slug: string;
  displayName: string;
  description?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  headerLogo?: string;
  footerLogo?: string;
}

export interface ThemeConfig {
  primary: string;
  accent: string;
  logoUrl: string;
  faviconUrl?: string;
  cssVars?: Record<string, string>;
  enableDark?: boolean;
  background?: string;
  textColor?: string;
}

export interface TenantConfig {
  tenant: TenantInfo & { branding?: BrandingConfig };
  theme: ThemeConfig;
  features: Record<string, boolean>;
  limits: { products: number; admins: number; storageMB: number };
  locale: string;
  currency: string;
  cdnBaseUrl: string;
  seo?: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  images: string[];
  stock?: number;
  active: boolean;
}

export interface CartItem {
  productId: string;
  qty: number;
  price: number;
}

export type OrderStatus = 'NEW' | 'PAID' | 'SHIPPED' | 'CANCELLED';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface JwtPayload {
  tenantId?: string;
  sub: string;
  email?: string;
  name?: string;
  role: string;
  permissions: string[];
  exp: number;
  iat?: number;
  isSuperAdmin?: boolean;
}
