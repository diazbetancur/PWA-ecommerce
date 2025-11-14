/**
 * Interfaz de branding PWA para multi-tenant
 * Toda la información proviene de URLs externas (no assets locales)
 */
export interface TenantBranding {
  /** Nombre del tenant para mostrar en UI y banner */
  name: string;

  /** URL del logo del tenant para UI y banner */
  logoUrl?: string;

  /** Color principal del tenant (hex, rgb, etc.) */
  primaryColor?: string;

  /** Color secundario para degradados o acentos */
  secondaryColor?: string;

  /** URL del ícono PWA para apple-touch-icon (recomendado 180x180) */
  pwaIconUrl?: string;

  /** URL del favicon (recomendado 32x32 o 48x48) */
  faviconUrl?: string;

  /** URL de un manifest.json ya generado para este tenant (opcional) */
  manifestUrl?: string;

  /** Short name para el manifest (máx 12 caracteres) */
  shortName?: string;

  /** Description para el manifest */
  description?: string;

  /** Background color del splash screen */
  backgroundColor?: string;

  /** Theme color para la barra de navegador */
  themeColor?: string;
}

/**
 * Configuración de assets PWA por defecto
 */
export interface PwaDefaultAssets {
  /** Ruta del ícono por defecto para apple-touch-icon */
  defaultIconPath: string;

  /** Ruta del favicon por defecto */
  defaultFaviconPath: string;

  /** Ruta del logo por defecto para banner iOS */
  defaultLogoPath: string;

  /** Ruta del manifest por defecto */
  defaultManifestPath: string;
}

/**
 * Estado del banner de instalación iOS
 */
export interface IosBannerState {
  /** Si el banner fue descartado en esta sesión */
  dismissed: boolean;

  /** Timestamp de cuándo fue descartado */
  dismissedAt?: number;

  /** Si fue descartado permanentemente (localStorage) */
  dismissedPermanently: boolean;
}

/**
 * Configuración del servicio PWA
 */
export interface PwaServiceConfig {
  /** Días antes de volver a mostrar el banner después de dismiss */
  bannerDismissExpireDays?: number;

  /** Key para localStorage del dismiss del banner */
  bannerDismissStorageKey?: string;

  /** Si se debe usar localStorage para persistir el dismiss */
  persistBannerDismiss?: boolean;

  /** Assets por defecto */
  defaultAssets: PwaDefaultAssets;
}

/**
 * Información de plataforma detectada
 */
export interface PlatformInfo {
  /** Si es iOS (iPhone, iPad, iPod) */
  isIos: boolean;

  /** Si es iPadOS (reportado como MacIntel con touch) */
  isIpadOs: boolean;

  /** Si es Safari */
  isSafari: boolean;

  /** Si es navegador WebKit (Safari, in-app browsers) */
  isWebKit: boolean;

  /** Si la PWA está instalada (standalone mode) */
  isStandalone: boolean;

  /** Si soporta beforeinstallprompt (Android/Desktop Chrome) */
  supportsInstallPrompt: boolean;
}
