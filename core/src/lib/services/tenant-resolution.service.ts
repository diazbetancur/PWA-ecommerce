import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type TenantResolutionSource = 'subdomain' | 'query' | 'default' | 'none';

export type TenantHostContext = 'storefront' | 'admin' | 'reserved' | 'unknown';

export interface TenantResolutionResult {
  slug: string | null;
  source: TenantResolutionSource;
  hostname: string;
  port: string | null;
  hostContext: TenantHostContext;
  isValidCandidate: boolean;
  isFallback: boolean;
  isStorefrontTenant: boolean;
  isAdminHost: boolean;
  debug: string;
}

@Injectable({ providedIn: 'root' })
export class TenantResolutionService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly cachedResolution = signal<TenantResolutionResult | null>(
    null
  );

  private readonly reservedHostLabels = new Set([
    'www',
    'api',
    'admin',
    'app',
    'staging',
    'dev',
    'localhost',
  ]);

  private readonly adminHostLabels = new Set(['admin']);

  private readonly tenantSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

  resolveTenant(forceRefresh = false): TenantResolutionResult {
    if (!forceRefresh) {
      const cached = this.cachedResolution();
      if (cached) {
        return cached;
      }
    }

    const result = this.computeResolution();
    this.cachedResolution.set(result);
    return result;
  }

  getCurrentResolution(): TenantResolutionResult {
    return this.resolveTenant(false);
  }

  getTenantSlug(): string | null {
    return this.getCurrentResolution().slug;
  }

  getResolutionSource(): TenantResolutionSource {
    return this.getCurrentResolution().source;
  }

  hasTenant(): boolean {
    return !!this.getTenantSlug();
  }

  isAdminContext(): boolean {
    return this.getCurrentResolution().isAdminHost;
  }

  isStorefrontContext(): boolean {
    const current = this.getCurrentResolution();
    return current.isStorefrontTenant;
  }

  clearCache(): void {
    this.cachedResolution.set(null);
  }

  private computeResolution(): TenantResolutionResult {
    const url = this.getSafeUrl();
    if (!url) {
      return this.buildNoneResult('unknown', null, 'url_not_available');
    }

    const hostname = url.hostname.toLowerCase();
    const port = url.port || null;
    const hostContext = this.classifyHostContext(hostname);

    const subdomainCandidate = this.extractSubdomainTenant(hostname);
    if (subdomainCandidate && this.isValidTenantSlug(subdomainCandidate)) {
      return {
        slug: subdomainCandidate,
        source: 'subdomain',
        hostname,
        port,
        hostContext: 'storefront',
        isValidCandidate: true,
        isFallback: false,
        isStorefrontTenant: true,
        isAdminHost: false,
        debug: 'resolved_from_subdomain',
      };
    }

    const queryCandidate = this.extractQueryTenant(url.searchParams);
    if (queryCandidate && this.isValidTenantSlug(queryCandidate)) {
      return {
        slug: queryCandidate,
        source: 'query',
        hostname,
        port,
        hostContext,
        isValidCandidate: true,
        isFallback: true,
        isStorefrontTenant: hostContext !== 'admin',
        isAdminHost: hostContext === 'admin',
        debug: 'resolved_from_query_fallback',
      };
    }

    return this.buildNoneResult(
      hostname,
      port,
      `no_tenant_resolved_${hostContext}`
    );
  }

  private getSafeUrl(): URL | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const href = this.document?.location?.href;
    if (!href) {
      return null;
    }

    try {
      return new URL(href);
    } catch {
      return null;
    }
  }

  private classifyHostContext(hostname: string): TenantHostContext {
    const labels = hostname.split('.');
    const firstLabel = labels[0];

    if (this.adminHostLabels.has(firstLabel)) {
      return 'admin';
    }

    if (this.reservedHostLabels.has(firstLabel)) {
      return 'reserved';
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'admin';
    }

    return 'unknown';
  }

  private extractSubdomainTenant(hostname: string): string | null {
    if (!hostname) {
      return null;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    const labels = hostname.split('.').map((label) => label.toLowerCase());

    // tenant.localhost
    const lastLabel = [...labels].reverse()[0];

    if (labels.length >= 2 && lastLabel === 'localhost') {
      const candidate = labels[0];
      return this.reservedHostLabels.has(candidate) ? null : candidate;
    }

    // tenant.localtest.me or tenant.lvh.me
    if (labels.length >= 3) {
      const candidate = labels[0];
      return this.reservedHostLabels.has(candidate) ? null : candidate;
    }

    return null;
  }

  private extractQueryTenant(params: URLSearchParams): string | null {
    const tenant = (params.get('tenant') || '').trim().toLowerCase();
    if (tenant) {
      return tenant;
    }

    const store = (params.get('store') || '').trim().toLowerCase();
    if (store) {
      return store;
    }

    return null;
  }

  private isValidTenantSlug(slug: string): boolean {
    if (!slug) {
      return false;
    }

    if (this.reservedHostLabels.has(slug)) {
      return false;
    }

    return this.tenantSlugPattern.test(slug);
  }

  private buildNoneResult(
    hostname: string,
    port: string | null,
    debug: string
  ): TenantResolutionResult {
    const hostContext = this.classifyHostContext(hostname);
    return {
      slug: null,
      source: 'none',
      hostname,
      port,
      hostContext,
      isValidCandidate: false,
      isFallback: false,
      isStorefrontTenant: false,
      isAdminHost: hostContext === 'admin',
      debug,
    };
  }
}
