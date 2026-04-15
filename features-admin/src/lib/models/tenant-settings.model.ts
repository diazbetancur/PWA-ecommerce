/**
 * ⚙️ Tenant Settings Models
 *
 * Contratos de configuración editable por tenant-admin.
 */

export interface TenantBrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

export type TenantBrandingColorSettings = Omit<
  TenantBrandingSettings,
  'logoUrl' | 'faviconUrl'
>;

export interface UpdateTenantBrandingRequest
  extends Partial<TenantBrandingColorSettings> {
  logo?: File | null;
  logoFile?: File | null;
  favicon?: File | null;
  faviconFile?: File | null;
}

export interface TenantContactSettings {
  email: string;
  phone: string;
  address: string;
  whatsApp: string;
}

export interface TenantSocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  tikTok: string;
}

export interface TenantLocaleSettings {
  locale: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
}

export interface TenantSeoSettings {
  title: string;
  description: string;
  keywords: string;
}

export interface TenantLoyaltyPointsPaymentSettings {
  isEnabled: boolean;
  moneyPerPoint: number;
  allowCombineWithCoupons: boolean;
  maxMoneyPerTransaction: number;
  minimumPayableAmount: number;
  currency: string;
}

export interface TenantSettingsDto {
  branding: TenantBrandingSettings;
  contact: TenantContactSettings;
  social: TenantSocialSettings;
  locale: TenantLocaleSettings;
  seo: TenantSeoSettings;
  loyaltyPointsPayment?: TenantLoyaltyPointsPaymentSettings;
}

export type UpdateTenantSettingsRequest = Partial<
  Omit<TenantSettingsDto, 'branding'>
> & {
  branding?: Partial<TenantBrandingColorSettings>;
};
