import {
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
  Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type {
  IosBannerState,
  PlatformInfo,
  PwaServiceConfig,
} from '../models/pwa-branding.types';

/**
 * Servicio para detectar plataforma y gestionar instalación PWA
 * Soporta:
 * - Detección robusta de iOS (incluyendo iPadOS)
 * - Detección de PWA instalada (standalone)
 * - Gestión del banner de instalación para iOS
 * - Persistencia de dismiss en localStorage
 */
@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Configuration
  private readonly config: PwaServiceConfig = {
    bannerDismissExpireDays: 30,
    bannerDismissStorageKey: 'pwa_ios_banner_dismissed',
    persistBannerDismiss: true,
    defaultAssets: {
      defaultIconPath: '/assets/pwa/default-icon-180.svg',
      defaultFaviconPath: '/assets/pwa/default-favicon.svg',
      defaultLogoPath: '/assets/pwa/default-logo.svg',
      defaultManifestPath: '/manifest.webmanifest',
    },
  };

  // Platform detection signals
  private readonly _platformInfo = signal<PlatformInfo>(this.detectPlatform());

  // Banner state signals
  private readonly _bannerState = signal<IosBannerState>({
    dismissed: false,
    dismissedPermanently: false,
  });

  // Public readonly signals
  public readonly platformInfo: Signal<PlatformInfo> =
    this._platformInfo.asReadonly();

  public readonly isIos = computed(() => this._platformInfo().isIos);
  public readonly isIpadOs = computed(() => this._platformInfo().isIpadOs);
  public readonly isStandalone = computed(
    () => this._platformInfo().isStandalone
  );
  public readonly supportsInstallPrompt = computed(
    () => this._platformInfo().supportsInstallPrompt
  );

  public readonly bannerDismissed = computed(
    () => this._bannerState().dismissed
  );

  /**
   * Signal que determina si se debe mostrar el banner de iOS
   * true solo cuando:
   * - Es iOS o iPadOS
   * - NO está en modo standalone
   * - El banner NO ha sido descartado
   */
  public readonly shouldShowIosBanner = computed(() => {
    const platform = this._platformInfo();
    const banner = this._bannerState();

    return (
      (platform.isIos || platform.isIpadOs) &&
      !platform.isStandalone &&
      !banner.dismissed &&
      !banner.dismissedPermanently
    );
  });

  constructor() {
    // Cargar estado de dismiss desde localStorage en el cliente
    if (this.isBrowser) {
      this.loadDismissState();
    }

    // Effect para debug (solo en desarrollo)
    if (this.isBrowser && !this.isProduction()) {
      effect(() => {
        this.shouldShowIosBanner();
      });
    }
  }

  /**
   * Detecta información de la plataforma actual
   */
  private detectPlatform(): PlatformInfo {
    if (!this.isBrowser) {
      return {
        isIos: false,
        isIpadOs: false,
        isSafari: false,
        isWebKit: false,
        isStandalone: false,
        supportsInstallPrompt: false,
      };
    }

    const userAgent = globalThis.navigator.userAgent.toLowerCase();
    const nav = globalThis.navigator as Navigator & { platform?: string };
    const platform = nav.platform?.toLowerCase() || '';

    // Detección de iOS
    const isIosDevice =
      /iphone|ipod/.test(userAgent) ||
      (/ipad/.test(userAgent) && 'ontouchend' in document);

    // Detección de iPadOS (se reporta como MacIntel desde iOS 13+)
    const msStream = globalThis as typeof globalThis & { MSStream?: unknown };
    const isIpadOsDevice =
      platform === 'macintel' &&
      navigator.maxTouchPoints > 1 &&
      !msStream.MSStream;

    // Detección de Safari
    const isSafariBrowser =
      /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    // Detección de WebKit (Safari y navegadores in-app en iOS)
    const isWebKitBrowser =
      isSafariBrowser ||
      /applewebkit/.test(userAgent) ||
      isIosDevice ||
      isIpadOsDevice;

    // Detección de modo standalone (PWA instalada)
    const navStandalone = globalThis.navigator as Navigator & {
      standalone?: boolean;
    };
    const isStandaloneMode =
      navStandalone.standalone === true || // iOS Safari
      globalThis.matchMedia('(display-mode: standalone)').matches; // Otros navegadores

    // Soporte de beforeinstallprompt (Chrome Android/Desktop)
    const supportsBeforeInstallPrompt = 'onbeforeinstallprompt' in globalThis;

    return {
      isIos: isIosDevice,
      isIpadOs: isIpadOsDevice,
      isSafari: isSafariBrowser,
      isWebKit: isWebKitBrowser,
      isStandalone: isStandaloneMode,
      supportsInstallPrompt: supportsBeforeInstallPrompt,
    };
  }

  /**
   * Marca el banner como descartado en la sesión actual
   */
  public markBannerDismissed(): void {
    this._bannerState.update((state) => ({
      ...state,
      dismissed: true,
      dismissedAt: Date.now(),
    }));
  }

  /**
   * Marca el banner como descartado permanentemente
   * Persiste en localStorage si está configurado
   */
  public markBannerDismissedPermanently(): void {
    const dismissedAt = Date.now();

    this._bannerState.update((state) => ({
      ...state,
      dismissed: true,
      dismissedPermanently: true,
      dismissedAt,
    }));

    if (this.config.persistBannerDismiss && this.isBrowser) {
      const storageKey = this.config.bannerDismissStorageKey;
      if (!storageKey) return;

      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            dismissedAt,
          })
        );
      } catch (error) {
        void error;
      }
    }
  }

  /**
   * Resetea el estado de dismiss del banner
   */
  public resetBannerDismiss(): void {
    this._bannerState.set({
      dismissed: false,
      dismissedPermanently: false,
    });

    if (this.isBrowser && this.config.bannerDismissStorageKey) {
      try {
        localStorage.removeItem(this.config.bannerDismissStorageKey);
      } catch (error) {
        void error;
      }
    }
  }

  /**
   * Carga el estado de dismiss desde localStorage
   */
  private loadDismissState(): void {
    if (!this.config.persistBannerDismiss) {
      return;
    }

    const storageKey = this.config.bannerDismissStorageKey;
    if (!storageKey) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored);
      const dismissedAt = data.dismissedAt as number;

      // Verificar si ha expirado
      const expireDays = this.config.bannerDismissExpireDays || 30;
      const expirationMs = expireDays * 24 * 60 * 60 * 1000;
      const isExpired = Date.now() - dismissedAt > expirationMs;

      if (isExpired) {
        // Ha expirado, limpiar
        localStorage.removeItem(storageKey);
        return;
      }

      // Actualizar estado
      this._bannerState.set({
        dismissed: true,
        dismissedPermanently: true,
        dismissedAt,
      });
    } catch (error) {
    }
  }

  /**
   * Obtiene la configuración del servicio
   */
  public getConfig(): Readonly<PwaServiceConfig> {
    return this.config;
  }

  /**
   * Actualiza la configuración del servicio
   */
  public updateConfig(partialConfig: Partial<PwaServiceConfig>): void {
    Object.assign(this.config, partialConfig);
  }

  /**
   * Re-detecta la plataforma (útil después de cambios en el navegador)
   */
  public refreshPlatformDetection(): void {
    this._platformInfo.set(this.detectPlatform());
  }

  /**
   * Verifica si está en modo producción
   */
  private isProduction(): boolean {
    return this.isBrowser && globalThis.location.hostname !== 'localhost';
  }
}
