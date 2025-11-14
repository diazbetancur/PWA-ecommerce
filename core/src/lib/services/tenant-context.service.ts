import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DEFAULT_TENANT_CONFIG } from '../config/default-tenant.config';
import { TenantConfig } from '../models/types';
import { TenantBootstrapService } from './tenant-bootstrap.service';

/**
 * Servicio de contexto del tenant que actúa como una capa de abstracción
 * sobre TenantBootstrapService para ser usado por interceptors y otros servicios
 */
@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly tenantBootstrap = inject(TenantBootstrapService);

  // Signals computados que se actualizan automáticamente
  readonly tenantSlug = computed(
    () => this.tenantBootstrap.currentTenant()?.tenant.slug ?? null
  );
  readonly tenantKey = computed(
    () => this.tenantBootstrap.currentTenant()?.tenant.id ?? null
  );
  readonly isReady = computed(
    () => this.tenantBootstrap.currentTenant() !== null
  );
  readonly currentConfig = computed(() => this.tenantBootstrap.currentTenant());
  readonly isLoading = computed(() => this.tenantBootstrap.isLoading());

  // Computed para datos del tenant
  readonly currentTenant = computed(
    () => this.tenantBootstrap.currentTenant()?.tenant ?? null
  );
  readonly tenantBranding = computed(
    () => this.currentTenant()?.branding ?? null
  );
  readonly tenantDisplayName = computed(
    () => this.currentTenant()?.displayName ?? null
  );

  // Computed para configuración regional y moneda
  readonly currency = computed(
    () => this.tenantBootstrap.currentTenant()?.currency ?? 'USD'
  );
  readonly locale = computed(
    () => this.tenantBootstrap.currentTenant()?.locale ?? 'en-US'
  );

  // Observables para compatibilidad con RxJS
  readonly tenantConfig$: Observable<TenantConfig | null> =
    this.tenantBootstrap.tenantConfig$;

  /**
   * Obtiene el slug del tenant actual
   * @returns string | null
   */
  getTenantSlug(): string | null {
    return this.tenantSlug();
  }

  /**
   * Obtiene la clave/ID del tenant para el backend
   * @returns string | null
   */
  getTenantKey(): string | null {
    return this.tenantKey();
  }

  /**
   * Verifica si el contexto del tenant está listo
   * @returns boolean
   */
  isTenantReady(): boolean {
    return this.isReady();
  }

  /**
   * Obtiene la configuración completa del tenant
   * @returns TenantConfig | null
   */
  getCurrentTenantConfig(): TenantConfig | null {
    return this.currentConfig();
  }

  /**
   * Obtiene la configuración del tenant o la configuración por defecto
   * Útil para páginas como login donde necesitamos branding aunque no haya tenant
   * @returns TenantConfig
   */
  getTenantConfigOrDefault(): TenantConfig {
    return this.currentConfig() ?? DEFAULT_TENANT_CONFIG;
  }

  /**
   * Obtiene el tenant actual con toda su información
   * @returns Tenant data object | null
   */
  getCurrentTenant() {
    return this.currentTenant();
  }

  /**
   * Alias para getCurrentTenantConfig (compatibilidad)
   * @returns TenantConfig | null
   */
  getTenantConfig(): TenantConfig | null {
    return this.getCurrentTenantConfig();
  }

  /**
   * Obtiene el estado de carga del tenant
   * @returns boolean
   */
  getTenantLoadingState(): boolean {
    return this.isLoading();
  }

  /**
   * Obtiene la moneda del tenant actual
   * @returns string - Código de moneda (ej: 'USD', 'EUR', 'MXN')
   */
  getCurrency(): string {
    return this.currency();
  }

  /**
   * Obtiene el locale del tenant actual
   * @returns string - Código de locale (ej: 'en-US', 'es-ES', 'es-MX')
   */
  getLocale(): string {
    return this.locale();
  }

  /**
   * Obtiene información básica del tenant para headers
   * @returns objeto con slug y key
   */
  getTenantHeaders(): { slug: string | null; key: string | null } {
    return {
      slug: this.getTenantSlug(),
      key: this.getTenantKey(),
    };
  }

  /**
   * Verifica si una URL debe incluir headers de tenant
   * Por defecto, todas las URLs que empiecen con /api/ (excepto públicas)
   * @param url - URL a verificar
   * @returns boolean
   */
  shouldIncludeTenantHeaders(url: string): boolean {
    // No incluir headers para URLs públicas
    if (url.includes('/api/public/') || url.includes('/api/health')) {
      return false;
    }

    // Incluir headers para todas las URLs de API
    if (url.startsWith('/api/') || url.includes('/api/')) {
      return true;
    }

    // No incluir headers para URLs externas o assets
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false;
    }

    return false;
  }

  /**
   * Espera a que el tenant esté cargado (útil para inicialización)
   * @param timeoutMs - Timeout en milisegundos (default: 5000)
   * @returns Promise que resuelve cuando el tenant está listo
   */
  async waitForTenant(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isTenantReady()) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando que el tenant esté listo'));
      }, timeoutMs);

      // Subscribirse a cambios hasta que el tenant esté listo
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
