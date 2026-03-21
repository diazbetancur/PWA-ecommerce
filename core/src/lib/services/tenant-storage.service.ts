import { Injectable, inject } from '@angular/core';
import { TenantResolutionService } from './tenant-resolution.service';

export type TenantStorageScope = 'tenant' | 'global';

@Injectable({ providedIn: 'root' })
export class TenantStorageService {
  private readonly tenantResolution = inject(TenantResolutionService);

  getNamespacedKey(
    baseKey: string,
    scope: TenantStorageScope = 'tenant'
  ): string {
    if (scope === 'global') {
      return `global_${baseKey}`;
    }

    const tenantSlug = this.tenantResolution.getTenantSlug() || 'no-tenant';
    return `${baseKey}_${tenantSlug}`;
  }

  set(
    baseKey: string,
    value: string,
    scope: TenantStorageScope = 'tenant'
  ): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.getNamespacedKey(baseKey, scope), value);
  }

  get(baseKey: string, scope: TenantStorageScope = 'tenant'): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.getNamespacedKey(baseKey, scope));
  }

  remove(baseKey: string, scope: TenantStorageScope = 'tenant'): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.getNamespacedKey(baseKey, scope));
  }
}
