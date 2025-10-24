import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ThemeConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  applyTheme(theme: ThemeConfig) {
    if (!isPlatformBrowser(this.platformId)) return;
    const doc = globalThis.document;
    if (!doc) return;
    const root = doc.documentElement as HTMLElement | null;
    // On SSR (Domino), documentElement may not support style mutations; bail out safely.
    if (!root?.style?.setProperty) {
      return;
    }

    if (theme.cssVars) {
      for (const [k, v] of Object.entries(theme.cssVars)) {
        root.style.setProperty(k, v);
      }
    }
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    // Map to Material CSS variables (approximate for M3 tokens)
    root.style.setProperty('--md-sys-color-primary', theme.primary);
    root.style.setProperty('--md-sys-color-secondary', theme.accent);
    // Compute contrast (simple luminance heuristic)
    const onPrimary = getContrastYIQ(theme.primary);
    const onAccent = getContrastYIQ(theme.accent);
    root.style.setProperty('--md-sys-color-on-primary', onPrimary);
    root.style.setProperty('--md-sys-color-on-secondary', onAccent);
    // Toolbar and button fallbacks
    root.style.setProperty(
      '--mat-toolbar-container-background-color',
      theme.primary
    );
    root.style.setProperty('--mat-toolbar-container-text-color', onPrimary);
    root.style.setProperty(
      '--mdc-filled-button-container-color',
      theme.primary
    );
    root.style.setProperty('--mdc-filled-button-label-text-color', onPrimary);
    // Optional additional vars
    if (theme.background) {
      root.style.setProperty('--color-background', theme.background);
    }
    if (theme.textColor) {
      root.style.setProperty('--color-text', theme.textColor);
    }

    // Update favicon
    if (theme.faviconUrl && globalThis.document) {
      const existing =
        globalThis.document?.querySelector<HTMLLinkElement>("link[rel='icon']");
      const created = globalThis.document?.createElement('link') as
        | HTMLLinkElement
        | undefined;
      const link = existing ?? created;
      if (link) {
        link.rel = 'icon';
        link.href = theme.faviconUrl;
        if (!link.parentElement) {
          globalThis.document?.head.appendChild(link);
        }
      }
    }
  }
}

function getContrastYIQ(hex: string): string {
  const c = hex.replace('#', '');
  const r = Number.parseInt(c.substring(0, 2), 16);
  const g = Number.parseInt(c.substring(2, 4), 16);
  const b = Number.parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}
