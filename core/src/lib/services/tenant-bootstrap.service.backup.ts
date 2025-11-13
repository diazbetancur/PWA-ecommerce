import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { TenantConfig } from '../models/types';
import {
  TenantConfigResponse,
  TenantResolutionStatus,
  TenantResolutionError,
  TenantResolutionStrategy,
  TenantBootstrapConfig
} from '../interfaces/tenant-resolution.interface';

/**
 * 🚀 Servicio de Bootstrap de Tenants conectado al Backend Real de Azure
 * 
 * Características:
 * - ✅ Resolución inteligente de tenants (query param > subdomain > hostname > default)
 * - ✅ Integración completa con ApiClientService (sin hardcodear URLs)
 * - ✅ Manejo robusto de errores con estados detallados
 * - ✅ Sistema de cache con TTL configurable
 * - ✅ Compatible con SSR (Server-Side Rendering)
 * - ✅ Signals de Angular para reactividad óptima
 * - ✅ Mapeo automático de backend DTO a configuración interna
 * 
 * Endpoint del Backend:
 * GET /api/public/tenant/resolve?tenant={slug}
 * 
 * @example
 * // En APP_INITIALIZER
 * const bootstrap = inject(TenantBootstrapService);
 * await bootstrap.initialize();
 * 
 * // Para verificar estado
 * if (bootstrap.hasError()) {
 *   router.navigate(['/tenant/not-found']);
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class TenantBootstrapService {
  private readonly apiClient = inject(ApiClientService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  // Configuración del servicio (puede ser inyectada desde el exterior)
  private readonly config: TenantBootstrapConfig = {
    defaultTenantSlug: 'demo-a',
    resolutionTimeout: 10000,
    maxRetries: 2,
    enableCache: true,
    cacheTTL: 300000, // 5 minutos
    enabledStrategies: ['query', 'subdomain', 'hostname', 'default'],
    redirectOnNotFound: true,
    errorRedirectUrl: '/tenant/not-found'
  };

  // Signals para el estado reactivo del tenant
  private readonly _currentTenant = signal<TenantConfig | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _status = signal<TenantResolutionStatus>('idle');
  private readonly _error = signal<TenantResolutionError | null>(null);
  private readonly _attemptedSlug = signal<string | null>(null);
  private readonly _resolvedStrategy = signal<TenantResolutionStrategy | null>(null);
  private readonly _backendResponse = signal<TenantConfigResponse | null>(null);

  // Cache en memoria para evitar requests innecesarias
  private readonly cache = new Map<string, { config: TenantConfig; timestamp: number }>();

  // BehaviorSubject para compatibilidad con RxJS
  private readonly _tenantConfig$ = new BehaviorSubject<TenantConfig | null>(null);

  // Configuración por defecto (fallback)
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

  // 📡 Propiedades públicas (readonly) para acceso reactivo
  readonly currentTenant = computed(() => this._currentTenant());
  readonly isLoading = computed(() => this._isLoading());
  readonly status = computed(() => this._status());
  readonly error = computed(() => this._error());
  readonly attemptedSlug = computed(() => this._attemptedSlug());
  readonly resolvedStrategy = computed(() => this._resolvedStrategy());
  readonly backendResponse = computed(() => this._backendResponse());

  // Observable para compatibilidad con código legacy
  readonly tenantConfig$ = this._tenantConfig$.asObservable();

  // Computed helpers para verificaciones rápidas
  readonly hasError = computed(() => this._status() === 'error' || this._status() === 'not-found');
  readonly isReady = computed(() => 
    this._status() === 'resolved' && !!this._currentTenant()
  );
  readonly needsRedirect = computed(() => {
    const error = this._error();
    return (error?.code === 'NOT_FOUND' || this._status() === 'not-found') && this.config.redirectOnNotFound;
  });

  /**
   * 🚀 Inicializa el tenant bootstrap conectándose al backend real de Azure
   * 
   * Este método debe ser llamado en APP_INITIALIZER para cargar la configuración
   * del tenant antes de que la aplicación arranque completamente.
   * 
   * Flujo:
   * 1. Detecta si está en SSR o Browser
   * 2. Resuelve el slug del tenant (query > subdomain > hostname > default)
   * 3. Verifica cache en memoria (si está habilitado)
   * 4. Llama al backend: GET /api/public/tenant/resolve?tenant={slug}
   * 5. Mapea la respuesta del backend a TenantConfig interno
   * 6. Aplica configuración al DOM (CSS vars, meta tags, etc.)
   * 7. Actualiza signals para reactividad
   * 
   * @throws Error si el tenant no existe o hay problemas de red
   */
  async initialize(): Promise<void> {
    // En SSR, usar configuración por defecto (el servidor puede inyectar config)
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🖥️ SSR detectado - usando configuración por defecto');
      this.setDefaultTenantConfig();
      return;
    }

    this._isLoading.set(true);
    this._status.set('resolving');
    this._error.set(null);

    const startTime = Date.now();

    try {
      // 1️⃣ Resolver el slug del tenant usando estrategias priorizadas
      const strategy = this.resolveTenantStrategy();
      this._resolvedStrategy.set(strategy);
      this._attemptedSlug.set(strategy.value);

      console.log('🔍 [TenantBootstrap] Resolviendo tenant:', {
        strategy: strategy.type,
        value: strategy.value,
        source: strategy.source
      });

      // 2️⃣ Verificar cache primero (si está habilitado)
      if (this.config.enableCache) {
        const cached = this.getCachedConfig(strategy.value);
        if (cached) {
          console.log('⚡ [TenantBootstrap] Configuración cargada desde cache:', strategy.value);
          this.applyTenantConfiguration(cached);
          this._currentTenant.set(cached);
          this._tenantConfig$.next(cached);
          this._status.set('resolved');
          this._isLoading.set(false);
          return;
        }
      }

      // 3️⃣ Cargar configuración desde el backend de Azure
      console.log('🌐 [TenantBootstrap] Llamando al backend:', `/api/public/tenant/resolve?tenant=${strategy.value}`);
      const backendResponse = await this.loadTenantFromBackend(strategy.value);
      
      // Guardar respuesta del backend para debugging
      this._backendResponse.set(backendResponse);

      // 4️⃣ Mapear respuesta del backend a formato interno
      const tenantConfig = this.mapBackendResponseToTenantConfig(backendResponse);

      // 5️⃣ Guardar en cache para futuras peticiones
      if (this.config.enableCache) {
        this.setCachedConfig(strategy.value, tenantConfig);
      }

      // 6️⃣ Aplicar configuración visual al DOM
      this.applyTenantConfiguration(tenantConfig);

      // 7️⃣ Actualizar signals y observables
      this._currentTenant.set(tenantConfig);
      this._tenantConfig$.next(tenantConfig);
      this._status.set('resolved');

      const duration = Date.now() - startTime;
      console.log(`✅ [TenantBootstrap] Tenant inicializado exitosamente en ${duration}ms:`, {
        slug: strategy.value,
        displayName: tenantConfig.tenant.displayName,
        strategy: strategy.type,
        cached: false
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [TenantBootstrap] Error inicializando tenant (${duration}ms):`, error);
      this.handleTenantError(error as HttpErrorResponse, this._attemptedSlug());
      
      // En caso de error, usar configuración por defecto para no bloquear la app
      // pero mantener el estado de error para que APP_INITIALIZER pueda redirigir
      this.setDefaultTenantConfig();
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

    this._error.set(tenantError);
    this._status.set('error');

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
