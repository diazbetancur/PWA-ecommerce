import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { ApiClientService } from './api-client.service';
import { TenantConfig } from '../models/types';
import { ManifestService } from './manifest.service';
import { SeoService } from './seo.service';
import { ThemeService } from './theme.service';

/**
 * Servicio para cargar y gestionar configuración de tenants
 * - Usa ApiClientService para backend real
 * - Mantiene HttpClient directo para archivos JSON locales en mock mode
 * - Maneja la lógica de resolución de tenants por hostname/query params
 */
@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private readonly http = inject(HttpClient); // Solo para archivos JSON locales
  private readonly apiClient = inject(ApiClientService); // Para backend real
  private readonly i18n = inject(TranslocoService);
  private readonly theme = inject(ThemeService);
  private readonly manifest = inject(ManifestService);
  private readonly seo = inject(SeoService);
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
    // Allow overriding tenant via query param or programmatic switchTenant
    let override: string | null = this._overrideSlug ?? null;
    if (!override) {
      const qp = new URLSearchParams(search);
      const t = qp.get('tenant');
      // Solo aceptar tenants específicos del query param
      if (t && t.trim() !== '') override = t;
    }

    // 🔐 Si no hay tenant específico, NO cargar ninguno (modo admin)
    if (!override) {
      console.log(
        '🔐 [TenantConfigService] Sin tenant específico - modo administrador general'
      );
      this._config = undefined;
      return;
    }

    // Resolution: solo usar el tenant explícitamente especificado
    const tenantKey = override;

    // During SSR build-time route extraction (no window available), avoid external HTTP
    // to prevent failures. Provide a minimal stub so the app can bootstrap.
    if (globalThis.window === undefined) {
      this._config = {
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
      };
      return;
    }

    try {
      // Diferent handling for mock vs real API
      if (this.env.mockApi) {
        // Para mock API, usar HttpClient directo para archivos JSON locales
        const url = `/config/tenants/${tenantKey}.json`;
        this._config = await firstValueFrom(this.http.get<TenantConfig>(url));
      } else {
        // Para backend real, usar ApiClientService con tenant resolution
        this._config = (await firstValueFrom(
          this.apiClient.getTenantConfig(tenantKey)
        )) as TenantConfig;
      }
      // Re-apply dynamic aspects after loading
      this.applyDynamic(reapply);
    } catch (e) {
      console.error('Failed to load tenant config', e);
      throw e;
    }
  }
  /**
   * Programmatic tenant switch without full page reload.
   */
  async switchTenant(slug: string): Promise<void> {
    this._overrideSlug = slug;
    await this.load(true);
    // Update URL query param to reflect the current tenant (optional, non-blocking)
    try {
      const url = new URL(globalThis.location.href);
      url.searchParams.set('tenant', slug);
      globalThis.history.replaceState({}, '', url.toString());
    } catch {
      // ignore URL update errors (e.g., browsers or environments without History API)
    }
  }

  /** Apply theme, manifest, SEO and i18n after a load or switch. */
  private applyDynamic(_triggeredBySwitch: boolean): void {
    const c = this._config;
    if (!c) return;
    // Avoid DOM operations on server
    if (globalThis.window !== undefined) {
      this.theme.applyTheme(c.theme);
      this.manifest.setTenantManifest(c);
    }
    this.seo.apply(c);
    this.i18n.setActiveLang(c.locale || 'es-CO');
  }
  private readonly env: AppEnv = inject(APP_ENV);
}
