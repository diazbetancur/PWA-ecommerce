import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DEFAULT_TENANT_CONFIG } from '../config/default-tenant.config';
import { type TenantBranding } from '../models/pwa-branding.types';
import { TenantConfig } from '../models/types';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { TenantConfigService } from './tenant-config.service';
import { TenantResolutionService } from './tenant-resolution.service';
import { TenantStorageService } from './tenant-storage.service';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly tenantResolution = inject(TenantResolutionService);
  private readonly tenantStorage = inject(TenantStorageService);

  private readonly resolvedConfig = computed<TenantConfig | null>(() => {
    // Fuente principal: config cargada por APP_INITIALIZER + resolver central.
    const configFromInitializer = this.tenantConfigService.config;
    if (configFromInitializer) {
      return configFromInitializer;
    }

    // Compatibilidad temporal: usar bootstrap solo cuando tenga un tenant real.
    const bootstrapConfig = this.tenantBootstrap.currentTenant();
    if (bootstrapConfig && bootstrapConfig.tenant.slug !== 'default') {
      return bootstrapConfig;
    }

    return null;
  });

  readonly tenantSlug = computed(
    () => this.resolvedConfig()?.tenant.slug ?? null
  );
  readonly tenantKey = computed(() => this.resolvedConfig()?.tenant.id ?? null);
  readonly isReady = computed(() => this.resolvedConfig() !== null);
  readonly currentConfig = computed(() => this.resolvedConfig());
  readonly isLoading = computed(() => this.tenantBootstrap.isLoading());

  readonly currentTenant = computed(
    () => this.resolvedConfig()?.tenant ?? null
  );
  readonly tenantBranding = computed(
    () => this.currentTenant()?.branding ?? null
  );
  readonly tenantDisplayName = computed(
    () => this.currentTenant()?.displayName ?? null
  );
  readonly tenantLogoUrl = computed(() => {
    const config = this.currentConfig();
    const tenantLogo =
      config?.tenant.branding?.logoUrl || config?.theme?.logoUrl || null;

    return this.resolveAssetUrl(tenantLogo, config?.cdnBaseUrl);
  });

  readonly currency = computed(() => this.resolvedConfig()?.currency ?? 'USD');
  readonly locale = computed(() => this.resolvedConfig()?.locale ?? 'en-US');

  readonly pwaBranding = computed(() => {
    const tenant = this.currentTenant();
    const config = this.currentConfig();

    if (!tenant || !config) {
      return null;
    }

    const branding = tenant.branding;
    const theme = config.theme;

    const pwaBranding: TenantBranding = {
      name: tenant.displayName || tenant.slug,
      shortName: tenant.displayName?.substring(0, 12) || tenant.slug,
      description: tenant.description,
      logoUrl: branding?.logoUrl || theme.logoUrl,
      primaryColor: branding?.primaryColor || theme.primary,
      secondaryColor: branding?.secondaryColor || theme.accent,
      pwaIconUrl: branding?.faviconUrl || theme.faviconUrl,
      faviconUrl: branding?.faviconUrl || theme.faviconUrl,
      backgroundColor:
        branding?.backgroundColor || theme.background || '#ffffff',
      themeColor: branding?.primaryColor || theme.primary || '#000000',
    };

    return pwaBranding;
  });

  readonly isGeneralTenant = computed(() => this.isGeneralAdminMode());

  readonly tenantConfig$: Observable<TenantConfig | null> =
    this.tenantBootstrap.tenantConfig$;

  getTenantSlug(): string | null {
    return this.tenantSlug();
  }

  getTenantKey(): string | null {
    return this.tenantKey();
  }

  isTenantReady(): boolean {
    return this.isReady();
  }

  getCurrentTenantConfig(): TenantConfig | null {
    return this.currentConfig();
  }

  getTenantConfigOrDefault(): TenantConfig {
    return this.currentConfig() ?? DEFAULT_TENANT_CONFIG;
  }

  getCurrentTenant() {
    return this.currentTenant();
  }

  getResolvedTenantLogoUrl(): string | null {
    return this.tenantLogoUrl();
  }

  getTenantConfig(): TenantConfig | null {
    return this.getCurrentTenantConfig();
  }

  getTenantLoadingState(): boolean {
    return this.isLoading();
  }

  getCurrency(): string {
    return this.currency();
  }

  getLocale(): string {
    return this.locale();
  }

  getTenantHeaders(): { slug: string | null; key: string | null } {
    return {
      slug: this.getTenantSlug(),
      key: this.getTenantKey(),
    };
  }

  isGeneralAdminMode(): boolean {
    const slug = this.getTenantSlug() ?? this.tenantResolution.getTenantSlug();
    return slug === null || slug === 'general-admin';
  }

  setGeneralAdminMode(): void {
    this.tenantBootstrap['_currentTenant'].set(null);
    this.tenantStorage.set('admin_mode', 'general', this.getStorageScope());
  }

  exitGeneralAdminMode(): void {
    this.tenantStorage.remove('admin_mode', this.getStorageScope());
  }

  shouldIncludeTenantHeaders(url: string): boolean {
    const requestPath = this.extractRequestPath(url);

    if (!requestPath || !this.shouldHandleHttpRequest(url)) {
      return false;
    }

    if (this.isTenantAwarePublicRequest(requestPath)) {
      return true;
    }

    if (this.isTenantScopedAdminRequest(requestPath)) {
      return true;
    }

    if (this.isGeneralAdminMode()) {
      return requestPath.startsWith('/api/admin/');
    }

    if (
      requestPath.startsWith('/api/public/') ||
      requestPath.startsWith('/api/health') ||
      requestPath === '/health' ||
      requestPath.startsWith('/admin/auth/')
    ) {
      return false;
    }

    return requestPath.startsWith('/api/') || requestPath.startsWith('/auth/');
  }

  shouldHandleHttpRequest(url: string): boolean {
    const requestPath = this.extractRequestPath(url);

    if (!requestPath) {
      return false;
    }

    return (
      requestPath.startsWith('/api/') ||
      requestPath.startsWith('/auth/') ||
      requestPath.startsWith('/admin/') ||
      requestPath.startsWith('/superadmin/') ||
      requestPath.startsWith('/admin/auth/') ||
      requestPath === '/health' ||
      requestPath.startsWith('/health/')
    );
  }

  async waitForTenant(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isTenantReady()) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando que el tenant esté listo'));
      }, timeoutMs);

      const interval = setInterval(() => {
        if (this.isTenantReady()) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  private getStorageScope(): 'tenant' | 'global' {
    return this.tenantResolution.isAdminContext() ? 'global' : 'tenant';
  }

  private extractRequestPath(url: string): string | null {
    if (!url) {
      return null;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        return new URL(url).pathname;
      } catch {
        return null;
      }
    }

    const queryIndex = url.indexOf('?');
    return queryIndex >= 0 ? url.slice(0, queryIndex) : url;
  }

  private isTenantAwarePublicRequest(requestPath: string): boolean {
    return requestPath.startsWith('/api/public/tenant/');
  }

  private resolveAssetUrl(
    assetUrl?: string | null,
    cdnBaseUrl?: string | null
  ): string | null {
    if (!assetUrl) {
      return null;
    }

    if (
      assetUrl.startsWith('http://') ||
      assetUrl.startsWith('https://') ||
      assetUrl.startsWith('data:') ||
      assetUrl.startsWith('blob:')
    ) {
      return assetUrl;
    }

    if (assetUrl.startsWith('/')) {
      return assetUrl;
    }

    if (cdnBaseUrl) {
      const normalizedBase = cdnBaseUrl.endsWith('/')
        ? cdnBaseUrl
        : `${cdnBaseUrl}/`;
      return `${normalizedBase}${assetUrl}`;
    }

    return `/${assetUrl}`;
  }

  private isTenantScopedAdminRequest(requestPath: string): boolean {
    if (this.tenantResolution.isAdminContext()) {
      return false;
    }

    return (
      requestPath.startsWith('/admin/settings') ||
      requestPath.startsWith('/admin/users') ||
      requestPath.startsWith('/admin/roles')
    );
  }
}
