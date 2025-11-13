import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, shareReplay, take } from 'rxjs/operators';
import { TenantConfig } from '../models/types';

// Interfaces adicionales para el bootstrap mejorado
export interface TenantResolutionStrategy {
  type: 'query' | 'subdomain' | 'hostname' | 'default';
  value: string;
}

export interface TenantApiResponse {
  success: boolean;
  data: TenantConfig;
  message?: string;
}

export type TenantStatus = 'loading' | 'ok' | 'error';

export interface TenantError {
  code: 'NOT_FOUND' | 'NETWORK_ERROR' | 'INVALID_CONFIG' | 'UNKNOWN';
  message: string;
  slug?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TenantBootstrapService {
  private readonly http = inject(HttpClient);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  // Signals para el estado del tenant
  private readonly _currentTenant = signal<TenantConfig | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _tenantStatus = signal<TenantStatus>('loading');
  private readonly _tenantError = signal<TenantError | null>(null);
  private readonly _attemptedSlug = signal<string | null>(null);

  // BehaviorSubject para compatibilidad con observables
  private readonly _tenantConfig$ = new BehaviorSubject<TenantConfig | null>(null);

  // Configuración por defecto
  private readonly DEFAULT_TENANT_CONFIG: TenantConfig = {
    tenant: {
      id: 'default',
      slug: 'default',
      displayName: 'PWA eCommerce'
    },
    theme: {
      primary: '#1976d2',
      accent: '#dc004e',
      logoUrl: '',
      faviconUrl: '/favicon.ico'
    },
    features: {},
    limits: { products: 1000, admins: 5, storageMB: 500 },
    locale: 'es-CO',
    currency: 'COP',
    cdnBaseUrl: ''
  };

  // Public readonly signals
  readonly currentTenant = this._currentTenant.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly tenantStatus = this._tenantStatus.asReadonly();
  readonly tenantError = this._tenantError.asReadonly();
  readonly attemptedSlug = this._attemptedSlug.asReadonly();

  // Public observable
  readonly tenantConfig$ = this._tenantConfig$.asObservable().pipe(
    shareReplay(1)
  );

  /**
   * Inicializa el tenant bootstrap
   * Este método debe ser llamado en APP_INITIALIZER
   */
  async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR, usar configuración por defecto o desde el servidor
      this.setDefaultTenantConfig();
      return;
    }

    this._isLoading.set(true);
    this._tenantStatus.set('loading');
    this._error.set(null);
    this._tenantError.set(null);

    try {
      const tenantSlug = this.resolveTenantSlug();
      this._attemptedSlug.set(tenantSlug);

      const tenantConfig = await this.loadTenantConfig(tenantSlug).pipe(take(1)).toPromise();

      if (tenantConfig) {
        this.applyTenantConfiguration(tenantConfig);
        this._currentTenant.set(tenantConfig);
        this._tenantConfig$.next(tenantConfig);
        this._tenantStatus.set('ok');
        console.log('✅ Tenant initialized successfully:', tenantSlug);
      } else {
        throw new Error('No se pudo cargar la configuración del tenant');
      }
    } catch (error) {
      console.error('❌ Error inicializando tenant:', error);
      this.handleTenantError(error, this._attemptedSlug());
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Maneja errores de tenant y establece el estado apropiado
   */
  private handleTenantError(error: any, attemptedSlug: string | null): void {
    let tenantError: TenantError;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 404:
          tenantError = {
            code: 'NOT_FOUND',
            message: `El tenant "${attemptedSlug}" no fue encontrado`,
            slug: attemptedSlug || undefined,
            timestamp: new Date()
          };
          break;
        case 0:
        case 500:
        case 502:
        case 503:
        case 504:
          tenantError = {
            code: 'NETWORK_ERROR',
            message: 'Error de conexión con el servidor. Por favor, intenta nuevamente.',
            slug: attemptedSlug || undefined,
            timestamp: new Date()
          };
          break;
        default:
          tenantError = {
            code: 'UNKNOWN',
            message: `Error del servidor: ${error.message}`,
            slug: attemptedSlug || undefined,
            timestamp: new Date()
          };
      }
    } else if (error.message?.includes('configuración inválida')) {
      tenantError = {
        code: 'INVALID_CONFIG',
        message: 'La configuración del tenant es inválida',
        slug: attemptedSlug || undefined,
        timestamp: new Date()
      };
    } else {
      tenantError = {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Error desconocido',
        slug: attemptedSlug || undefined,
        timestamp: new Date()
      };
    }

    this._tenantError.set(tenantError);
    this._tenantStatus.set('error');
    this._error.set(tenantError.message);

    console.error('🔥 Tenant Error Details:', tenantError);
  }

  /**
   * Reinicia el estado de error y reintenta cargar el tenant
   */
  async retryTenantLoad(newSlug?: string): Promise<void> {
    if (newSlug) {
      // Actualizar la URL si se proporciona un nuevo slug
      const url = new URL(this.document.location.href);
      url.searchParams.set('tenant', newSlug);
      this.document.location.href = url.toString();
    } else {
      // Recargar el tenant actual
      await this.initialize();
    }
  }

  /**
   * Verifica si el tenant actual tiene errores
   */
  hasError(): boolean {
    return this._tenantStatus() === 'error';
  }

  /**
   * Obtiene detalles del error actual
   */
  getCurrentError(): TenantError | null {
    return this._tenantError();
  }

  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this._tenantError.set(null);
    this._error.set(null);
    this._tenantStatus.set('loading');
  }

  /**
   * Resuelve el slug del tenant usando diferentes estrategias
   */
  private resolveTenantSlug(): string {
    const strategies = this.getTenantResolutionStrategies();

    for (const strategy of strategies) {
      if (strategy.value && strategy.value !== 'default') {
        console.log(`Tenant resuelto por ${strategy.type}: ${strategy.value}`);
        return strategy.value;
      }
    }

    console.log('Usando tenant por defecto');
    return this.DEFAULT_TENANT_CONFIG.tenant.slug;
  }

  /**
   * Obtiene las estrategias de resolución de tenant en orden de prioridad
   */
  private getTenantResolutionStrategies(): TenantResolutionStrategy[] {
    // 1. Query parameter ?tenant=
    const urlParams = new URLSearchParams(this.document.location.search);
    const queryTenant = urlParams.get('tenant');

    // 2. Subdomain
    const hostname = this.document.location.hostname;
    const subdomainMatch = hostname.match(/^([^.]+)\./);
    const subdomain = subdomainMatch ? subdomainMatch[1] : '';

    // Excluir subdomains comunes que no son tenants
    const excludedSubdomains = ['www', 'api', 'admin', 'app', 'staging', 'dev'];
    const validSubdomain = subdomain && !excludedSubdomains.includes(subdomain) ? subdomain : '';

    const strategies: TenantResolutionStrategy[] = [
      {
        type: 'query',
        value: queryTenant || ''
      },
      {
        type: 'subdomain',
        value: validSubdomain
      },
      {
        type: 'hostname',
        value: this.mapHostnameToTenant(hostname)
      },
      {
        type: 'default',
        value: this.DEFAULT_TENANT_CONFIG.tenant.slug
      }
    ];

    return strategies;
  }

  /**
   * Mapea hostnames específicos a slugs de tenant
   * Útil para dominios personalizados
   */
  private mapHostnameToTenant(hostname: string): string {
    const hostnameMap: Record<string, string> = {
      'localhost:4200': 'default',
      'demo.example.com': 'demo',
      // Agregar más mapeos según sea necesario
    };

    return hostnameMap[hostname] || '';
  }

  /**
   * Carga la configuración del tenant desde el backend
   */
  private loadTenantConfig(tenantSlug: string): Observable<TenantConfig | null> {
    // URL del endpoint público del backend
    const apiUrl = `/api/public/tenant/resolve?tenant=${tenantSlug}`;

    return this.http.get<TenantApiResponse>(apiUrl).pipe(
      map((response: TenantApiResponse) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Respuesta inválida del servidor');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error cargando configuración del tenant:', error);

        // Si el tenant no existe, intentar con el default
        if (error.status === 404 && tenantSlug !== this.DEFAULT_TENANT_CONFIG.tenant.slug) {
          console.log('Tenant no encontrado, intentando con default...');
          return this.loadTenantConfig(this.DEFAULT_TENANT_CONFIG.tenant.slug);
        }

        // Para otros errores, retornar null para usar configuración por defecto
        return of(null);
      })
    );
  }

  /**
   * Aplica la configuración del tenant al DOM y estilos
   */
  private applyTenantConfiguration(config: TenantConfig): void {
    // Aplicar título de la página
    this.title.setTitle(config.tenant.displayName);

    // Aplicar meta tags
    this.updateMetaTags(config);

    // Aplicar variables CSS del theme
    this.applyThemeVariables(config);

    // Aplicar favicon si está definido
    if (config.theme.faviconUrl) {
      this.updateFavicon(config.theme.faviconUrl);
    }

    console.log('Configuración del tenant aplicada:', config.tenant.slug);
  }

  /**
   * Actualiza los meta tags de la página
   */
  private updateMetaTags(config: TenantConfig): void {
    const description = `Tienda online de ${config.tenant.displayName}`;

    // Description
    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: config.tenant.displayName });
    this.meta.updateTag({ property: 'og:description', content: description });
    if (config.theme.logoUrl) {
      this.meta.updateTag({ property: 'og:image', content: config.theme.logoUrl });
    }

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:title', content: config.tenant.displayName });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (config.theme.logoUrl) {
      this.meta.updateTag({ name: 'twitter:image', content: config.theme.logoUrl });
    }

    // Theme color para PWA
    this.meta.updateTag({ name: 'theme-color', content: config.theme.primary });
  }

  /**
   * Aplica las variables CSS del theme
   */
  private applyThemeVariables(config: TenantConfig): void {
    const root = this.document.documentElement;
    const theme = config.theme;

    // Variables básicas de color del tenant
    root.style.setProperty('--tenant-primary-color', theme.primary);
    root.style.setProperty('--tenant-accent-color', theme.accent);

    if (theme.background) {
      root.style.setProperty('--tenant-background-color', theme.background);
    }
    if (theme.textColor) {
      root.style.setProperty('--tenant-text-color', theme.textColor);
    }

    // Variables personalizadas del theme
    if (theme.cssVars) {
      for (const [key, value] of Object.entries(theme.cssVars)) {
        root.style.setProperty(`--tenant-${key}`, value);
      }
    }

    // Material Design CSS variables integration
    root.style.setProperty('--mat-sys-primary', theme.primary);
    root.style.setProperty('--mat-sys-secondary', theme.accent);
    root.style.setProperty('--mat-sys-tertiary', theme.accent);

    // Variables adicionales para Material Design 3
    if (theme.background) {
      root.style.setProperty('--mat-sys-surface', theme.background);
    }
  }

  /**
   * Actualiza el favicon de la página
   */
  private updateFavicon(faviconUrl: string): void {
    const existingFavicon = this.document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (existingFavicon) {
      existingFavicon.href = faviconUrl;
    } else {
      const newFavicon = this.document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = faviconUrl;
      this.document.head.appendChild(newFavicon);
    }
  }

  /**
   * Establece la configuración por defecto
   */
  private setDefaultTenantConfig(): void {
    this.applyTenantConfiguration(this.DEFAULT_TENANT_CONFIG);
    this._currentTenant.set(this.DEFAULT_TENANT_CONFIG);
    this._tenantConfig$.next(this.DEFAULT_TENANT_CONFIG);
  }

  // Métodos públicos para acceder a la configuración

  /**
   * Obtiene el slug del tenant actual
   */
  getTenantSlug(): string | null {
    return this._currentTenant()?.tenant.slug || null;
  }

  /**
   * Obtiene el ID del tenant para usar en requests al backend
   */
  getTenantId(): string | null {
    return this._currentTenant()?.tenant.id || null;
  }

  /**
   * Obtiene la configuración completa del tenant actual
   */
  getTenantConfig(): TenantConfig | null {
    return this._currentTenant();
  }

  /**
   * Verifica si el tenant está cargado
   */
  isTenantLoaded(): boolean {
    return this._currentTenant() !== null;
  }

  /**
   * Recarga la configuración del tenant
   */
  async reloadTenant(): Promise<void> {
    await this.initialize();
  }
}
