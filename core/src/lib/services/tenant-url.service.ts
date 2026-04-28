import { Injectable } from '@angular/core';

export interface TenantUrlBuildOptions {
  path?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantUrlService {
  private readonly technicalHostPrefixes = new Set([
    'www',
    'api',
    'admin',
    'app',
  ]);

  private readonly environmentHostPrefixes = new Set([
    'dev',
    'staging',
    'qa',
    'prod',
    'pdn',
  ]);

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
    return this.buildSubdomainUrl(normalizedSlug, path);
  }

  private buildSubdomainUrl(tenantSlug: string, path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const { protocol, hostname, port } = globalThis.location;
    const normalizedHostname = hostname.toLowerCase();
    const portSegment = port ? `:${port}` : '';

    if (
      normalizedHostname === 'localhost' ||
      normalizedHostname === '127.0.0.1'
    ) {
      return `${protocol}//${tenantSlug}.localhost${portSegment}${normalizedPath}`;
    }

    const labels = normalizedHostname.split('.').filter(Boolean);
    if (labels.length === 2 && labels[1] === 'localhost') {
      return `${protocol}//${tenantSlug}.localhost${portSegment}${normalizedPath}`;
    }

    if (labels.length === 2) {
      return `${protocol}//${tenantSlug}.${normalizedHostname}${portSegment}${normalizedPath}`;
    }

    const [firstLabel] = labels;
    let baseHost = labels.slice(1).join('.');

    if (this.environmentHostPrefixes.has(firstLabel)) {
      baseHost = normalizedHostname;
    }

    if (this.technicalHostPrefixes.has(firstLabel)) {
      baseHost = labels.slice(1).join('.');
    }

    return `${protocol}//${tenantSlug}.${baseHost}${portSegment}${normalizedPath}`;
  }
}
