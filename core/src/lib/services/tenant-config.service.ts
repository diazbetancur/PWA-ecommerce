import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { BrandingConfig, TenantConfig, ThemeConfig } from '../models/types';
import { ApiClientService } from './api-client.service';
import { ManifestService } from './manifest.service';
import { SeoService } from './seo.service';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiClient = inject(ApiClientService);
  private readonly i18n = inject(TranslocoService);
  private readonly theme = inject(ThemeService);
  private readonly manifest = inject(ManifestService);
  private readonly seo = inject(SeoService);
  private readonly env: AppEnv = inject(APP_ENV);

  private _config?: TenantConfig;
  private _overrideSlug?: string | null;

  get config(): TenantConfig | undefined {
    return this._config;
  }

  get tenantSlug(): string | undefined {
    return this._config?.tenant.slug;
  }

  async load(reapply = false): Promise<void> {
    const search = globalThis.location?.search ?? '';
    let override: string | null = this._overrideSlug ?? null;

    if (!override) {
      const qp = new URLSearchParams(search);
      const t = qp.get('tenant');
      if (t && t.trim() !== '') override = t;
    }

    if (!override) {
      this._config = undefined;
      return;
    }

    const tenantKey = override;

    if (globalThis.window === undefined) {
      this._config = this.withNormalizedTheme({
        tenant: { id: 'stub', slug: tenantKey, displayName: 'Demo Tenant' },
        theme: {
          primary: '#1976d2',
          accent: '#e91e63',
          logoUrl: '/icons/icon-192x192.png',
          cssVars: { '--primary': '#1976d2', '--accent': '#e91e63' },
        },
        features: {},
        limits: { products: 1000, admins: 10, storageMB: 1024 },
        locale: 'es-CO',
        currency: 'COP',
        cdnBaseUrl: '',
      });
      return;
    }

    try {
      if (this.env.mockApi) {
        const url = `/config/tenants/${tenantKey}.json`;
        const loaded = await firstValueFrom(this.http.get<TenantConfig>(url));
        this._config = this.withNormalizedTheme(loaded);
      } else {
        const loaded = (await firstValueFrom(
          this.apiClient.getTenantConfig(tenantKey)
        )) as TenantConfig;
        this._config = this.withNormalizedTheme(loaded);
      }
      this.applyDynamic(reapply);
    } catch (e: any) {
      // Si es 404, no lanzar error - dejar config undefined para que el guard redirija
      if (e?.status === 404) {
        this._config = undefined;
        return;
      }
      throw e;
    }
  }

  async switchTenant(slug: string): Promise<void> {
    this._overrideSlug = slug;
    await this.load(true);
    try {
      const url = new URL(globalThis.location.href);
      url.searchParams.set('tenant', slug);
      globalThis.history.replaceState({}, '', url.toString());
    } catch {
      // ignore URL update errors
    }
  }

  private applyDynamic(_triggeredBySwitch: boolean): void {
    const c = this._config;
    if (!c) return;
    if (globalThis.window !== undefined) {
      this.theme.applyTheme(c.theme);
      this.manifest.setTenantManifest(c);
    }
    this.seo.apply(c);
    this.i18n.setActiveLang(c.locale || 'es-CO');
  }

  private withNormalizedTheme(config: TenantConfig): TenantConfig {
    const branding = config.tenant?.branding;
    const mergedTheme = this.mergeThemeWithBranding(config.theme, branding);

    return {
      ...config,
      theme: mergedTheme,
    };
  }

  private mergeThemeWithBranding(
    theme: ThemeConfig,
    branding?: BrandingConfig
  ): ThemeConfig {
    if (!branding) {
      return theme;
    }

    return {
      ...theme,
      primary: branding.primaryColor || theme.primary,
      accent: branding.accentColor || theme.accent,
      background: branding.backgroundColor || theme.background,
      textColor: branding.textColor || theme.textColor,
      logoUrl: branding.logoUrl || theme.logoUrl,
      faviconUrl: branding.faviconUrl || theme.faviconUrl,
    };
  }
}
