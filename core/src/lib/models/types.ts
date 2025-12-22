// Auth Response Types

/**
 * Permisos de módulo por usuario
 */
export interface ModulePermission {
  moduleCode: string;
  moduleName: string;
  iconName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Usuario autenticado con permisos detallados
 */
export interface AuthUser {
  userId: string; // Backend envía "userId" no "id"
  email: string;
  userType: 'tenant_user' | 'customer' | 'super_admin'; // Tipo de usuario
  firstName?: string;
  lastName?: string;
  roles: string[]; // Array de roles como strings
  permissions: ModulePermission[]; // Permisos estructurados por módulo
  isActive: boolean;
  mustChangePassword?: boolean;
  // Campos opcionales para clientes
  phoneNumber?: string;
  fullName?: string;
  createdAt?: string;
  lastLoginAt?: string | null;
}

/**
 * Respuesta del login
 */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

/**
 * Perfil del usuario (para endpoint /auth/me)
 */
export interface UserProfile {
  userId: string; // Usar userId como en AuthUser
  email: string;
  userType: 'tenant_user' | 'customer' | 'super_admin';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  fullName?: string;
  isActive: boolean;
  roles: string[];
  permissions?: ModulePermission[]; // Permisos estructurados
  createdAt?: string;
  lastLoginAt?: string | null;
  mustChangePassword?: boolean;
}

export interface TenantInfo {
  id: string;
  slug: string;
  displayName: string;
  description?: string;
  status?: 'Ready' | 'Pending' | 'Seeding' | 'Suspended' | 'Failed';
  plan?: string;
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

export interface TenantContact {
  email?: string;
  phone?: string;
  address?: string;
  whatsApp?: string;
}

export interface TenantSocial {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tikTok?: string;
}

export interface TenantSeo {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface TenantMessages {
  welcome?: string;
  cartEmpty?: string;
  checkoutSuccess?: string;
  outOfStock?: string;
}

export interface AppFeatures {
  enableCart?: boolean;
  enableWishlist?: boolean;
  enableReviews?: boolean;
  enableComparisons?: boolean;
}

export interface TenantConfig {
  tenant: TenantInfo & { branding?: BrandingConfig };
  theme: ThemeConfig;
  features: Record<string, boolean>;
  appFeatures?: AppFeatures;
  limits?: { products: number; admins: number; storageMB: number };
  locale: string;
  currency: string;
  currencySymbol?: string;
  taxRate?: number;
  cdnBaseUrl?: string;
  apiBaseUrl?: string;
  contact?: TenantContact;
  social?: TenantSocial;
  seo?: TenantSeo;
  messages?: TenantMessages;
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

/**
 * Payload del JWT decodificado
 */
/**
 * Payload del JWT token
 * Estructura actualizada según el formato del backend
 */
export interface JwtPayload {
  sub: string; // User ID
  email?: string;
  jti?: string; // JWT ID
  tenant_id?: string; // ID del tenant
  tenant_slug?: string; // Slug del tenant
  roles: string[]; // Array de roles (ej: ["Customer"], ["SuperAdmin"], ["Customer", "Manager"])
  modules: string[]; // Array de módulos permitidos (ej: ["products", "categories", "banners"])
  exp: number; // Expiration timestamp
  iat?: number; // Issued at timestamp
  admin?: string | boolean; // Flag de admin para tokens sin tenant (ej: "true" o true)

  // Campos legacy para compatibilidad (deprecados)
  /** @deprecated Use roles array instead */
  role?: string | string[];
  /** @deprecated Use tenant_id instead */
  tenantId?: string;
  /** @deprecated Use modules instead */
  modulePermissions?: ModulePermission[];
  /** @deprecated Use roles.includes('SuperAdmin') instead */
  isSuperAdmin?: boolean;
  /** @deprecated Use roles instead */
  userType?: 'tenant_user' | 'customer' | 'super_admin';
}

/**
 * Interfaz de branding PWA para multi-tenant
 * Exportada desde types.ts para facilitar importación
 */
export interface TenantBranding {
  name: string;
  shortName?: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  pwaIconUrl?: string;
  faviconUrl?: string;
  manifestUrl?: string;
  backgroundColor?: string;
  themeColor?: string;
}
