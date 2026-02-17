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

    applyCustomCssVars(root, theme.cssVars);

    const secondary =
      theme.cssVars?.['--tenant-secondary-color'] || theme.accent;
    const background = theme.background || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const primaryHover = darkenHex(theme.primary, 10);
    const primaryLight = lightenHex(theme.primary, 92);

    applyTenantColorVars(root, {
      primary: theme.primary,
      secondary,
      accent: theme.accent,
      background,
      textColor,
      primaryHover,
      primaryLight,
    });

    applyTenantImageVars(root, {
      logoUrl: theme.logoUrl,
      faviconUrl: theme.faviconUrl,
    });

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

function applyCustomCssVars(
  root: HTMLElement,
  cssVars?: Record<string, string>
): void {
  if (!cssVars) {
    return;
  }

  for (const [k, v] of Object.entries(cssVars)) {
    root.style.setProperty(k, v);
  }
}

function applyTenantColorVars(
  root: HTMLElement,
  vars: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    textColor: string;
    primaryHover: string;
    primaryLight: string;
  }
): void {
  const onPrimary = getContrastYIQ(vars.primary);
  root.style.setProperty('--tenant-primary-color', vars.primary);
  root.style.setProperty('--tenant-secondary-color', vars.secondary);
  root.style.setProperty('--tenant-accent-color', vars.accent);
  root.style.setProperty('--tenant-background-color', vars.background);
  root.style.setProperty('--tenant-text-color', vars.textColor);
  root.style.setProperty('--tenant-primary-hover', vars.primaryHover);
  root.style.setProperty('--tenant-primary-light', vars.primaryLight);
  root.style.setProperty('--tenant-border-color', 'rgba(31, 41, 55, 0.2)');
  root.style.setProperty('--tenant-surface-color', '#ffffff');
  root.style.setProperty('--tenant-text-muted-color', 'rgba(31, 41, 55, 0.72)');

  // Compatibility aliases used in legacy admin/shared styles
  root.style.setProperty('--tenant-primary', vars.primary);
  root.style.setProperty(
    '--tenant-primary-active',
    darkenHex(vars.primary, 18)
  );
  root.style.setProperty('--tenant-on-primary', onPrimary);

  root.style.setProperty('--primary-color', vars.primary);
  root.style.setProperty('--primary-hover', vars.primaryHover);
  root.style.setProperty('--primary-light', vars.primaryLight);
  root.style.setProperty('--secondary-color', vars.secondary);
  root.style.setProperty('--bg-color', vars.background);
  root.style.setProperty('--text-color', vars.textColor);
  root.style.setProperty('--border-color', 'rgba(31, 41, 55, 0.2)');
  root.style.setProperty('--hover-bg', vars.primaryLight);
}

function applyTenantImageVars(
  root: HTMLElement,
  vars: { logoUrl?: string; faviconUrl?: string }
): void {
  if (vars.logoUrl) {
    root.style.setProperty('--tenant-logo-url', `url("${vars.logoUrl}")`);
  }

  if (vars.faviconUrl) {
    root.style.setProperty('--tenant-favicon-url', `url("${vars.faviconUrl}")`);
  }
}

function lightenHex(hex: string, percent: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  const [r, g, b] = normalized;
  const rr = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  const gg = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  const bb = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
  return rgbToHex(rr, gg, bb);
}

function darkenHex(hex: string, percent: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  const [r, g, b] = normalized;
  const rr = Math.max(0, Math.floor(r * (1 - percent / 100)));
  const gg = Math.max(0, Math.floor(g * (1 - percent / 100)));
  const bb = Math.max(0, Math.floor(b * (1 - percent / 100)));
  return rgbToHex(rr, gg, bb);
}

function normalizeHex(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '').trim();
  if (value.length !== 6) {
    return null;
  }

  const r = Number.parseInt(value.substring(0, 2), 16);
  const g = Number.parseInt(value.substring(2, 4), 16);
  const b = Number.parseInt(value.substring(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) {
    return null;
  }

  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getContrastYIQ(hex: string): string {
  const c = hex.replace('#', '');
  const r = Number.parseInt(c.substring(0, 2), 16);
  const g = Number.parseInt(c.substring(2, 4), 16);
  const b = Number.parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}
