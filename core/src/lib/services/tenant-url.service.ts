import { Injectable } from '@angular/core';

export interface TenantUrlBuildOptions {
  path?: string;
  forceQueryParam?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantUrlService {
  buildStorefrontAccessUrl(
    tenantSlug: string,
    options?: TenantUrlBuildOptions
  ): string {
    const path = options?.path ?? '/';

    if (globalThis.window === undefined) {
      return path;
    }

    if (!tenantSlug || tenantSlug.trim() === '') {
      return `${globalThis.location.origin}${path}`;
    }

    const normalizedSlug = tenantSlug.trim().toLowerCase();

    if (options?.forceQueryParam) {
      return this.buildQueryUrl(normalizedSlug, path);
    }

    const subdomainUrl = this.buildSubdomainUrl(normalizedSlug, path);
    if (subdomainUrl) {
      return subdomainUrl;
    }

    return this.buildQueryUrl(normalizedSlug, path);
  }

  private buildSubdomainUrl(tenantSlug: string, path: string): string | null {
    const { protocol, hostname } = globalThis.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    const labels = hostname.split('.');
    if (labels.length < 2) {
      return null;
    }

    const registrableDomain = labels.slice(-2).join('.');
    return `${protocol}//${tenantSlug}.${registrableDomain}${path}`;
  }

  private buildQueryUrl(tenantSlug: string, path: string): string {
    const url = new URL(`${globalThis.location.origin}${path}`);
    url.searchParams.set('tenant', tenantSlug);
    return url.toString();
  }
}
