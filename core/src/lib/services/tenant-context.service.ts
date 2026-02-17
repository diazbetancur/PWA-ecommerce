import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DEFAULT_TENANT_CONFIG } from '../config/default-tenant.config';
import { type TenantBranding } from '../models/pwa-branding.types';
import { TenantConfig } from '../models/types';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { TenantConfigService } from './tenant-config.service';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly tenantConfigService = inject(TenantConfigService);

  private readonly resolvedConfig = computed<TenantConfig | null>(() => {
    const bootstrapConfig = this.tenantBootstrap.currentTenant();
    if (bootstrapConfig) {
      return bootstrapConfig;
    }

    return this.tenantConfigService.config ?? null;
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
    const slug = this.getTenantSlug();
    return slug === null || slug === 'general-admin';
  }

  setGeneralAdminMode(): void {
    this.tenantBootstrap['_currentTenant'].set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('admin-mode', 'general');
    }
  }

  exitGeneralAdminMode(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('admin-mode');
    }
  }

  shouldIncludeTenantHeaders(url: string): boolean {
    if (this.isGeneralAdminMode()) {
      return url.includes('/api/admin/');
    }

    if (url.includes('/api/public/') || url.includes('/api/health')) {
      return false;
    }

    if (url.startsWith('/api/') || url.includes('/api/')) {
      return true;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false;
    }

    return false;
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

      const subscription = this.tenantConfig$.subscribe((config) => {
        if (config !== null) {
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }
}
