import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  signal,
} from '@angular/core';
import type { TenantBranding } from '../models/pwa-branding.types';
import { PwaInstallService } from './pwa-install.service';

/**
 * Servicio para gestionar assets PWA dinámicos por tenant
 * Actualiza manifest, apple-touch-icon, favicon según branding del tenant
 * Usa URLs externas con fallback a assets por defecto
 */
@Injectable({
  providedIn: 'root',
})
export class DynamicPwaAssetsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly pwaInstallService = inject(PwaInstallService);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly renderer: Renderer2;

  // Signal para tracking del branding aplicado
  private readonly _currentBranding = signal<TenantBranding | null>(null);
  public readonly currentBranding = this._currentBranding.asReadonly();

  // Signal para saber si los assets han sido aplicados
  private readonly _assetsApplied = signal(false);
  public readonly assetsApplied = computed(() => this._assetsApplied());

  // Cache de elementos DOM para no recrearlos innecesariamente
  private manifestLink: HTMLLinkElement | null = null;
  private appleTouchIconLink: HTMLLinkElement | null = null;
  private faviconLink: HTMLLinkElement | null = null;
  private themeColorMeta: HTMLMetaElement | null = null;

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    // Effect para log en desarrollo
    if (this.isBrowser && !this.isProduction()) {
      effect(() => {
        console.log(
          '[DynamicPwaAssetsService] Current Branding:',
          this._currentBranding()
        );
        console.log(
          '[DynamicPwaAssetsService] Assets Applied:',
          this._assetsApplied()
        );
      });
    }
  }

  /**
   * Aplica el branding del tenant a los assets PWA
   * Actualiza manifest, íconos, favicon y theme color
   */
  public applyBranding(branding: TenantBranding | null): void {
    if (!this.isBrowser) {
      return;
    }

    const config = this.pwaInstallService.getConfig();

    // Actualizar manifest
    this.updateManifest(
      branding?.manifestUrl || config.defaultAssets.defaultManifestPath
    );

    // Actualizar apple-touch-icon
    this.updateAppleTouchIcon(
      branding?.pwaIconUrl || config.defaultAssets.defaultIconPath
    );

    // Actualizar favicon
    this.updateFavicon(
      branding?.faviconUrl || config.defaultAssets.defaultFaviconPath
    );

    // Actualizar theme color
    if (branding?.themeColor) {
      this.updateThemeColor(branding.themeColor);
    }

    // Si hay manifestUrl personalizada, intentar generarla dinámicamente
    if (!branding?.manifestUrl && branding) {
      this.generateDynamicManifest(branding);
    }

    this._currentBranding.set(branding);
    this._assetsApplied.set(true);
  }

  /**
   * Actualiza el link del manifest
   */
  private updateManifest(manifestUrl: string): void {
    this.manifestLink ??= this.findOrCreateLink('manifest');
    this.renderer.setAttribute(this.manifestLink, 'href', manifestUrl);
  }

  /**
   * Actualiza el apple-touch-icon
   */
  private updateAppleTouchIcon(iconUrl: string): void {
    this.appleTouchIconLink ??= this.findOrCreateLink('apple-touch-icon');
    this.renderer.setAttribute(this.appleTouchIconLink, 'href', iconUrl);
  }

  /**
   * Actualiza el favicon
   */
  private updateFavicon(faviconUrl: string): void {
    this.faviconLink ??= this.findOrCreateLink('icon');
    this.renderer.setAttribute(this.faviconLink, 'href', faviconUrl);
  }

  /**
   * Actualiza el theme-color meta tag
   */
  private updateThemeColor(color: string): void {
    this.themeColorMeta ??= this.findOrCreateMeta('theme-color');
    this.renderer.setAttribute(this.themeColorMeta, 'content', color);
  }

  /**
   * Busca o crea un link element
   */
  private findOrCreateLink(rel: string): HTMLLinkElement {
    let link = this.document.head.querySelector(
      `link[rel="${rel}"]`
    ) as HTMLLinkElement;

    if (!link) {
      link = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(link, 'rel', rel);

      // Atributos específicos según el tipo
      if (rel === 'icon') {
        this.renderer.setAttribute(link, 'type', 'image/png');
        this.renderer.setAttribute(link, 'sizes', '32x32');
      } else if (rel === 'apple-touch-icon') {
        this.renderer.setAttribute(link, 'sizes', '180x180');
      }

      this.renderer.appendChild(this.document.head, link);
    }

    return link;
  }

  /**
   * Busca o crea un meta element
   */
  private findOrCreateMeta(name: string): HTMLMetaElement {
    let meta = this.document.head.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement;

    if (!meta) {
      meta = this.renderer.createElement('meta') as HTMLMetaElement;
      this.renderer.setAttribute(meta, 'name', name);
      this.renderer.appendChild(this.document.head, meta);
    }

    return meta;
  }

  /**
   * Genera un manifest dinámico basado en el branding
   * Crea un blob URL con el manifest JSON
   */
  private generateDynamicManifest(branding: TenantBranding): void {
    try {
      const config = this.pwaInstallService.getConfig();

      const manifest = {
        name: branding.name,
        short_name: branding.shortName || branding.name.substring(0, 12),
        description: branding.description || `${branding.name} - eCommerce PWA`,
        start_url: '/',
        display: 'standalone',
        background_color: branding.backgroundColor || '#ffffff',
        theme_color: branding.themeColor || branding.primaryColor || '#000000',
        icons: [
          {
            src: branding.pwaIconUrl || config.defaultAssets.defaultIconPath,
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: branding.pwaIconUrl || config.defaultAssets.defaultIconPath,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      };

      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json',
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      this.updateManifest(manifestUrl);
    } catch (error) {
      console.warn(
        '[DynamicPwaAssetsService] Error generando manifest dinámico:',
        error
      );
    }
  }

  /**
   * Limpia los assets aplicados y vuelve a los por defecto
   */
  public resetToDefaults(): void {
    this.applyBranding(null);
  }

  /**
   * Obtiene el branding actual aplicado
   */
  public getCurrentBranding(): TenantBranding | null {
    return this._currentBranding();
  }

  /**
   * Verifica si los assets ya han sido aplicados
   */
  public areAssetsApplied(): boolean {
    return this._assetsApplied();
  }

  /**
   * Pre-carga una imagen para evitar flickering
   */
  public preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Pre-carga múltiples imágenes del branding
   */
  public async preloadBrandingAssets(branding: TenantBranding): Promise<void> {
    const urls = [
      branding.logoUrl,
      branding.pwaIconUrl,
      branding.faviconUrl,
    ].filter(Boolean) as string[];

    await Promise.allSettled(urls.map((url) => this.preloadImage(url)));
  }

  /**
   * Verifica si está en modo producción
   */
  private isProduction(): boolean {
    return this.isBrowser && globalThis.location.hostname !== 'localhost';
  }
}
