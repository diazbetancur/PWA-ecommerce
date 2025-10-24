import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TenantConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ManifestBuilderService {
  build(config: TenantConfig): string {
    const manifest = {
      name: config.tenant.displayName,
      short_name: config.tenant.slug,
      start_url: '/',
      display: 'standalone',
      theme_color: config.theme.primary,
      background_color: config.theme.background ?? '#ffffff',
      icons: [
        { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
        { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
        { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    };
    const blob = new Blob([JSON.stringify(manifest)], {
      type: 'application/manifest+json',
    });
    return URL.createObjectURL(blob);
  }
}

@Injectable({ providedIn: 'root' })
export class ManifestService {
  private readonly builder = new ManifestBuilderService();
  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  setTenantManifest(config: TenantConfig) {
    if (!isPlatformBrowser(this.platformId)) return;
    const href = this.builder.build(config);
    const linkEl =
      (globalThis.document?.querySelector(
        "link[rel='manifest']"
      ) as HTMLLinkElement) || globalThis.document?.createElement('link');
    if (!linkEl) return;
    linkEl.setAttribute('rel', 'manifest');
    linkEl.setAttribute('href', href);
    if (!linkEl.parentElement) globalThis.document?.head.appendChild(linkEl);
  }
  // NOTE: En SSR/runtime futuro, servir manifest desde backend para SEO completo.
}
