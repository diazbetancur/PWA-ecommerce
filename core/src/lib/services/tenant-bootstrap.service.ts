import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  PublicTenantConfigResponse,
  TenantBootstrapConfig,
  TenantResolutionError,
  TenantResolutionStatus,
  TenantResolutionStrategy,
} from '../interfaces/tenant-resolution.interface';
import { TenantConfig } from '../models/types';
import { ApiClientService } from './api-client.service';

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
 * ✅ ALINEADO CON API DOCUMENTATION v1
 * Endpoint del Backend: GET /public/tenant-config
 * Header requerido: X-Tenant-Slug (inyectado automáticamente por TenantHeaderInterceptor)
 *
 * @example
 * // En APP_INITIALIZER
 * const bootstrap = inject(TenantBootstrapService);
 * await bootstrap.initialize();
 *
 * // Para verificar estado
 * if (bootstrap.hasErrorState()) {
 *   router.navigate(['/tenant/not-found']);
 * }
 */
@Injectable({
  providedIn: 'root',
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
    errorRedirectUrl: '/tenant/not-found',
  };

  // Signals para el estado reactivo del tenant
  private readonly _currentTenant = signal<TenantConfig | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _status = signal<TenantResolutionStatus>('idle');
  private readonly _error = signal<TenantResolutionError | null>(null);
  private readonly _attemptedSlug = signal<string | null>(null);
  private readonly _resolvedStrategy = signal<TenantResolutionStrategy | null>(
    null
  );
  private readonly _backendResponse = signal<PublicTenantConfigResponse | null>(
    null
  );

  // Cache en memoria para evitar requests innecesarias
  private readonly cache = new Map<
    string,
    { config: TenantConfig; timestamp: number }
  >();

  // BehaviorSubject para compatibilidad con RxJS
  private readonly _tenantConfig$ = new BehaviorSubject<TenantConfig | null>(
    null
  );

  // Configuración por defecto (fallback)
  private readonly DEFAULT_TENANT_CONFIG: TenantConfig = {
    tenant: {
      id: 'default',
      slug: 'default',
      displayName: 'PWA eCommerce',
    },
    theme: {
      primary: '#1976d2',
      accent: '#dc004e',
      logoUrl: '',
      faviconUrl: '/favicon.ico',
    },
    features: {},
    limits: { products: 1000, admins: 5, storageMB: 500 },
    locale: 'es-CO',
    currency: 'COP',
    cdnBaseUrl: '',
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
  readonly hasErrorState = computed(
    () => this._status() === 'error' || this._status() === 'not-found'
  );
  readonly isReady = computed(
    () => this._status() === 'resolved' && !!this._currentTenant()
  );
  readonly needsRedirect = computed(() => {
    const error = this._error();
    return (
      (error?.code === 'NOT_FOUND' || this._status() === 'not-found') &&
      this.config.redirectOnNotFound
    );
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
        source: strategy.source,
      });

      // 2️⃣ Verificar cache primero (si está habilitado)
      if (this.config.enableCache) {
        const cached = this.getCachedConfig(strategy.value);
        if (cached) {
          console.log(
            '⚡ [TenantBootstrap] Configuración cargada desde cache:',
            strategy.value
          );
          this.applyTenantConfiguration(cached);
          this._currentTenant.set(cached);
          this._tenantConfig$.next(cached);
          this._status.set('resolved');
          this._isLoading.set(false);
          return;
        }
      }

      // 3️⃣ Cargar configuración desde el backend de Azure
      console.log(
        '🌐 [TenantBootstrap] Llamando al backend:',
        `/api/public/tenant/resolve?tenant=${strategy.value}`
      );
      const backendResponse = await this.loadTenantFromBackend(strategy.value);

      // Guardar respuesta del backend para debugging
      this._backendResponse.set(backendResponse);

      // 4️⃣ Mapear respuesta del backend a formato interno
      const tenantConfig =
        this.mapBackendResponseToTenantConfig(backendResponse);

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
      console.log(
        `✅ [TenantBootstrap] Tenant inicializado exitosamente en ${duration}ms:`,
        {
          slug: strategy.value,
          displayName: tenantConfig.tenant.displayName,
          strategy: strategy.type,
          cached: false,
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [TenantBootstrap] Error inicializando tenant (${duration}ms):`,
        error
      );
      this.handleTenantError(error as HttpErrorResponse, this._attemptedSlug());

      // En caso de error, usar configuración por defecto para no bloquear la app
      // pero mantener el estado de error para que APP_INITIALIZER pueda redirigir
      this.setDefaultTenantConfig();
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * 🔍 Resuelve la estrategia de tenant usando múltiples métodos
   * Prioridad: query param > subdomain > hostname > default
   */
  private resolveTenantStrategy(): TenantResolutionStrategy {
    // 1. Query parameter ?tenant=
    const urlParams = new URLSearchParams(this.document.location.search);
    const queryTenant = urlParams.get('tenant');
    if (queryTenant) {
      return {
        type: 'query',
        value: queryTenant,
        source: `query parameter: ?tenant=${queryTenant}`,
        priority: 1,
      };
    }

    // 2. Subdomain
    const hostname = this.document.location.hostname;
    const subdomainMatch = hostname.match(/^([^.]+)\./);
    const subdomain = subdomainMatch ? subdomainMatch[1] : '';

    // Excluir subdomains comunes que no son tenants
    const excludedSubdomains = [
      'www',
      'api',
      'admin',
      'app',
      'staging',
      'dev',
      'localhost',
    ];
    if (subdomain && !excludedSubdomains.includes(subdomain)) {
      return {
        type: 'subdomain',
        value: subdomain,
        source: `subdomain: ${subdomain}.${hostname
          .split('.')
          .slice(1)
          .join('.')}`,
        priority: 2,
      };
    }

    // 3. Hostname completo (dominios custom)
    const mappedTenant = this.mapHostnameToTenant(hostname);
    if (mappedTenant) {
      return {
        type: 'hostname',
        value: mappedTenant,
        source: `hostname mapping: ${hostname} -> ${mappedTenant}`,
        priority: 3,
      };
    }

    // 4. Tenant por defecto
    return {
      type: 'default',
      value: this.config.defaultTenantSlug,
      source: `default configuration`,
      priority: 4,
    };
  }

  /**
   * 🗺️ Mapea hostnames específicos a slugs de tenant
   * Útil para dominios personalizados
   */
  private mapHostnameToTenant(hostname: string): string {
    const hostnameMap: Record<string, string> = {
      localhost: '', // No mapear localhost
      'localhost:4200': '',
      'demo.example.com': 'demo',
      'store-a.example.com': 'demo-a',
      'store-b.example.com': 'demo-b',
      // Agregar más mapeos según sea necesario
    };

    return hostnameMap[hostname] || '';
  }

  /**
   * 🌐 Carga la configuración del tenant desde el backend de Azure
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * Endpoint: GET /public/tenant-config
   * Header: X-Tenant-Slug (inyectado automáticamente por TenantHeaderInterceptor)
   *
   * NOTA: El header X-Tenant-Slug debe estar configurado ANTES de llamar a este método.
   * El TenantBootstrapService debe setear el tenant slug antes de hacer la request.
   */
  private async loadTenantFromBackend(
    tenantSlug: string
  ): Promise<PublicTenantConfigResponse> {
    try {
      // ⚠️ IMPORTANTE: Antes de llamar al endpoint, necesitamos que el interceptor
      // sepa qué tenant slug usar. Esto se maneja a través del TenantService.

      // Llamar al endpoint que requiere X-Tenant-Slug header
      const response = await firstValueFrom(
        this.apiClient.get<PublicTenantConfigResponse>('/public/tenant-config')
      );

      console.log('📦 [TenantBootstrap] Respuesta del backend:', response);
      return response;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          console.warn(
            `⚠️ [TenantBootstrap] Tenant "${tenantSlug}" no encontrado`
          );
          throw new HttpErrorResponse({
            error: { message: `Tenant "${tenantSlug}" no encontrado` },
            status: 404,
            statusText: 'Not Found',
            url: `/public/tenant-config (X-Tenant-Slug: ${tenantSlug})`,
          });
        }
        if (error.status === 409) {
          console.warn(
            `⚠️ [TenantBootstrap] Tenant "${tenantSlug}" no está listo o no resuelto`
          );
          throw new HttpErrorResponse({
            error: { message: `Tenant "${tenantSlug}" conflict (not ready)` },
            status: 409,
            statusText: 'Conflict',
            url: `/public/tenant-config (X-Tenant-Slug: ${tenantSlug})`,
          });
        }
        console.error('🔥 [TenantBootstrap] Error HTTP del backend:', error);
        throw error;
      }
      console.error('🔥 [TenantBootstrap] Error inesperado:', error);
      throw new Error(`Error cargando tenant: ${error}`);
    }
  }

  /**
   * 🔄 Mapea la respuesta del backend (.NET) al formato interno de TenantConfig
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * La API actual devuelve una estructura simple:
   * {
   *   name: string,
   *   slug: string,
   *   theme: {},
   *   seo: {},
   *   features: string[]
   * }
   *
   * Nota: theme y seo están vacíos por ahora según la documentación.
   */
  private mapBackendResponseToTenantConfig(
    response: PublicTenantConfigResponse
  ): TenantConfig {
    // Convertir features array a objeto de booleans
    const featuresMap: Record<string, boolean> = {};
    for (const feature of response.features) {
      featuresMap[feature] = true;
    }

    return {
      tenant: {
        id: response.slug, // Usar slug como ID temporal
        slug: response.slug,
        displayName: response.name,
      },
      theme: {
        primary: '#1976d2', // Colores por defecto hasta que el backend los envíe
        accent: '#dc004e',
        logoUrl: '',
        faviconUrl: '/favicon.ico',
        // Expandir theme si el backend lo envía en el futuro
        ...response.theme,
      },
      features: {
        // Mapear features comunes del array a propiedades específicas
        catalog: featuresMap['catalog'] || false,
        cart: featuresMap['cart'] || false,
        checkout: featuresMap['checkout'] || false,
        guestCheckout: featuresMap['guest_checkout'] || false,
        categories: featuresMap['categories'] || false,
        push: featuresMap['push'] || false,
        // Mantener el mapa completo para acceso genérico
        ...featuresMap,
      },
      limits: {
        products: 1000, // Defaults hasta que el backend los provea
        admins: 5,
        storageMB: 500,
      },
      locale: 'es-CO', // Default hasta que el backend lo provea
      currency: 'COP', // Default hasta que el backend lo provea
      cdnBaseUrl: '',
      // Guardar datos de SEO para uso futuro
      seo: response.seo,
    };
  }

  /**
   * 🚨 Maneja errores de tenant y establece el estado apropiado
   */
  private handleTenantError(
    error: HttpErrorResponse | Error,
    attemptedSlug: string | null
  ): void {
    let tenantError: TenantResolutionError;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 404:
          tenantError = {
            code: 'NOT_FOUND',
            message: `El tenant "${attemptedSlug}" no fue encontrado en el sistema`,
            slug: attemptedSlug || undefined,
            statusCode: 404,
            timestamp: new Date(),
            retryable: false,
          };
          this._status.set('not-found');
          break;

        case 0:
          tenantError = {
            code: 'NETWORK_ERROR',
            message:
              'No se pudo conectar al servidor. Verifica tu conexión a internet.',
            slug: attemptedSlug || undefined,
            statusCode: 0,
            timestamp: new Date(),
            retryable: true,
          };
          this._status.set('error');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          tenantError = {
            code: 'NETWORK_ERROR',
            message:
              'El servidor está experimentando problemas. Por favor, intenta nuevamente en unos momentos.',
            slug: attemptedSlug || undefined,
            statusCode: error.status,
            timestamp: new Date(),
            retryable: true,
          };
          this._status.set('error');
          break;

        case 401:
        case 403:
          tenantError = {
            code: 'UNAUTHORIZED',
            message: 'No tienes permisos para acceder a este tenant.',
            slug: attemptedSlug || undefined,
            statusCode: error.status,
            timestamp: new Date(),
            retryable: false,
          };
          this._status.set('error');
          break;

        default:
          tenantError = {
            code: 'UNKNOWN',
            message: `Error del servidor (${error.status}): ${error.message}`,
            slug: attemptedSlug || undefined,
            statusCode: error.status,
            timestamp: new Date(),
            retryable: false,
          };
          this._status.set('error');
      }
    } else {
      tenantError = {
        code: 'UNKNOWN',
        message: error.message || 'Error desconocido al cargar el tenant',
        slug: attemptedSlug || undefined,
        timestamp: new Date(),
        retryable: false,
      };
      this._status.set('error');
    }

    this._error.set(tenantError);

    console.error('🔥 [TenantBootstrap] Detalles del error:', {
      code: tenantError.code,
      message: tenantError.message,
      slug: tenantError.slug,
      statusCode: tenantError.statusCode,
      retryable: tenantError.retryable,
      timestamp: tenantError.timestamp,
    });
  }

  /**
   * 💾 Obtiene configuración del cache
   */
  private getCachedConfig(slug: string): TenantConfig | null {
    const cached = this.cache.get(slug);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > this.config.cacheTTL;

    if (isExpired) {
      this.cache.delete(slug);
      return null;
    }

    return cached.config;
  }

  /**
   * 💾 Guarda configuración en cache
   */
  private setCachedConfig(slug: string, config: TenantConfig): void {
    this.cache.set(slug, {
      config,
      timestamp: Date.now(),
    });
  }

  /**
   * 🎨 Aplica la configuración del tenant al DOM
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

    console.log(
      '🎨 [TenantBootstrap] Configuración visual aplicada:',
      config.tenant.slug
    );
  }

  /**
   * 🏷️ Actualiza los meta tags de la página
   */
  private updateMetaTags(config: TenantConfig): void {
    const description =
      config.tenant.description ||
      `Tienda online de ${config.tenant.displayName}`;

    // Description
    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph
    this.meta.updateTag({
      property: 'og:title',
      content: config.tenant.displayName,
    });
    this.meta.updateTag({ property: 'og:description', content: description });
    if (config.theme.logoUrl) {
      this.meta.updateTag({
        property: 'og:image',
        content: config.theme.logoUrl,
      });
    }

    // Twitter Card
    this.meta.updateTag({
      name: 'twitter:title',
      content: config.tenant.displayName,
    });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (config.theme.logoUrl) {
      this.meta.updateTag({
        name: 'twitter:image',
        content: config.theme.logoUrl,
      });
    }

    // Theme color para PWA
    this.meta.updateTag({ name: 'theme-color', content: config.theme.primary });
  }

  /**
   * 🎨 Aplica las variables CSS del theme
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
  }

  /**
   * 🖼️ Actualiza el favicon de la página
   */
  private updateFavicon(faviconUrl: string): void {
    const existingFavicon = this.document.querySelector(
      'link[rel="icon"]'
    ) as HTMLLinkElement;
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
   * 📋 Establece la configuración por defecto
   */
  private setDefaultTenantConfig(): void {
    this.applyTenantConfiguration(this.DEFAULT_TENANT_CONFIG);
    this._currentTenant.set(this.DEFAULT_TENANT_CONFIG);
    this._tenantConfig$.next(this.DEFAULT_TENANT_CONFIG);
    this._status.set('resolved');
  }

  // ==================== Métodos Públicos ====================

  /**
   * 🔑 Obtiene el slug del tenant actual
   */
  getTenantSlug(): string | null {
    return this._currentTenant()?.tenant.slug || null;
  }

  /**
   * 🆔 Obtiene el ID del tenant para usar en requests al backend
   */
  getTenantId(): string | null {
    return this._currentTenant()?.tenant.id || null;
  }

  /**
   * 📦 Obtiene la configuración completa del tenant actual
   */
  getTenantConfig(): TenantConfig | null {
    return this._currentTenant();
  }

  /**
   * ✅ Verifica si el tenant está cargado
   */
  isTenantLoaded(): boolean {
    return this._currentTenant() !== null && this._status() === 'resolved';
  }

  /**
   * 🔄 Recarga la configuración del tenant
   */
  async reloadTenant(newSlug?: string): Promise<void> {
    if (newSlug) {
      // Actualizar la URL con el nuevo slug
      const url = new URL(this.document.location.href);
      url.searchParams.set('tenant', newSlug);
      this.document.location.href = url.toString();
    } else {
      // Reinicializar con el slug actual
      await this.initialize();
    }
  }

  /**
   * 🧹 Limpia el cache de tenants
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [TenantBootstrap] Cache limpiado');
  }

  /**
   * 🔍 Obtiene información de debugging
   */
  getDebugInfo() {
    return {
      currentTenant: this._currentTenant(),
      status: this._status(),
      error: this._error(),
      attemptedSlug: this._attemptedSlug(),
      strategy: this._resolvedStrategy(),
      backendResponse: this._backendResponse(),
      cacheSize: this.cache.size,
      isReady: this.isReady(),
      hasError: this.hasErrorState(),
      needsRedirect: this.needsRedirect(),
    };
  }

  // ===== Compatibilidad con componentes existentes (métodos esperados) =====
  tenantStatus() {
    return this._status();
  }

  tenantError() {
    return this._error();
  }

  hasError() {
    return this._error() !== null;
  }

  retryTenantLoad(): Promise<void> | void {
    // Reintentar carga; en browser simplemente reinicializa
    if (isPlatformBrowser(this.platformId)) {
      return this.initialize();
    }
  }
}
