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

@Injectable({ providedIn: 'root' })
export class TenantBootstrapService {
  private readonly apiClient = inject(ApiClientService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly config: TenantBootstrapConfig = {
    defaultTenantSlug: '',
    resolutionTimeout: 10000,
    maxRetries: 2,
    enableCache: true,
    cacheTTL: 300000,
    enabledStrategies: ['query', 'subdomain', 'hostname', 'default'],
    redirectOnNotFound: true,
    errorRedirectUrl: '/tenant/not-found',
  };

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

  private readonly cache = new Map<
    string,
    { config: TenantConfig; timestamp: number }
  >();
  private readonly _tenantConfig$ = new BehaviorSubject<TenantConfig | null>(
    null
  );

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

  readonly currentTenant = computed(() => this._currentTenant());
  readonly isLoading = computed(() => this._isLoading());
  readonly status = computed(() => this._status());
  readonly error = computed(() => this._error());
  readonly attemptedSlug = computed(() => this._attemptedSlug());
  readonly resolvedStrategy = computed(() => this._resolvedStrategy());
  readonly backendResponse = computed(() => this._backendResponse());
  readonly tenantConfig$ = this._tenantConfig$.asObservable();

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

  async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.setDefaultTenantConfig();
      return;
    }

    this._isLoading.set(true);
    this._status.set('resolving');
    this._error.set(null);

    try {
      const strategy = this.resolveTenantStrategy();
      console.log('[TenantBootstrap] Resolved strategy:', strategy);
      this._resolvedStrategy.set(strategy);
      this._attemptedSlug.set(strategy.value);

      if (!strategy.value || strategy.value.trim() === '') {
        console.warn(
          '[TenantBootstrap] No tenant slug found, using default config'
        );
        this.setDefaultTenantConfig();
        this._status.set('resolved');
        this._isLoading.set(false);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('admin-mode', 'general');
        }
        return;
      }

      console.log(`[TenantBootstrap] Loading tenant: ${strategy.value}`);

      if (this.config.enableCache) {
        const cached = this.getCachedConfig(strategy.value);
        if (cached) {
          this.applyTenantConfiguration(cached);
          this._currentTenant.set(cached);
          this._tenantConfig$.next(cached);
          this._status.set('resolved');
          this._isLoading.set(false);
          return;
        }
      }

      const backendResponse = await this.loadTenantFromBackend(strategy.value);
      console.log('[TenantBootstrap] Backend response:', backendResponse);
      this._backendResponse.set(backendResponse);

      const tenantConfig =
        this.mapBackendResponseToTenantConfig(backendResponse);
      console.log('[TenantBootstrap] Mapped tenant config:', tenantConfig);

      if (this.config.enableCache) {
        this.setCachedConfig(strategy.value, tenantConfig);
      }

      this.applyTenantConfiguration(tenantConfig);
      this._currentTenant.set(tenantConfig);
      this._tenantConfig$.next(tenantConfig);
      this._status.set('resolved');
      console.log(
        `[TenantBootstrap] ✅ Tenant initialized successfully: ${tenantConfig.tenant.slug}`
      );
    } catch (error) {
      console.error('[TenantBootstrap] Error loading tenant:', error);
      this.handleTenantError(error as HttpErrorResponse, this._attemptedSlug());
      this.setDefaultTenantConfig();
    } finally {
      this._isLoading.set(false);
    }
  }

  private resolveTenantStrategy(): TenantResolutionStrategy {
    console.log('[TenantBootstrap] === START resolveTenantStrategy ===');

    const urlParams = new URLSearchParams(this.document.location.search);
    const queryTenant = urlParams.get('tenant');
    console.log('[TenantBootstrap] Query param tenant:', queryTenant);

    if (queryTenant) {
      console.log('[TenantBootstrap] ✅ Using query param');
      return {
        type: 'query',
        value: queryTenant,
        source: `query parameter: ?tenant=${queryTenant}`,
        priority: 1,
      };
    }

    // Intentar obtener tenant del token JWT si existe
    console.log('[TenantBootstrap] No query param, checking JWT token...');

    // CRÍTICO: Verificar que localStorage esté disponible (solo en navegador)
    if (
      !isPlatformBrowser(this.platformId) ||
      typeof globalThis.localStorage === 'undefined'
    ) {
      console.log(
        '[TenantBootstrap] localStorage not available (SSR or not in browser)'
      );
      return {
        type: 'default',
        value: '',
        source: 'default configuration (localStorage not available)',
        priority: 4,
      };
    }

    // DEBUG: Ver todas las claves en localStorage
    const allKeys = Object.keys(globalThis.localStorage);
    console.log('[TenantBootstrap] 🔍 All localStorage keys:', allKeys);
    console.log(
      '[TenantBootstrap] 🔍 Keys starting with "mtkn_":',
      allKeys.filter((k) => k.startsWith('mtkn_'))
    );
    console.log(
      '[TenantBootstrap] 🔍 Has superadmin_token?:',
      allKeys.includes('superadmin_token')
    );

    // El token puede estar en dos lugares dependiendo del tipo de usuario:
    // 1. 'superadmin_token' para SuperAdmin
    // 2. 'mtkn_{tenant}' para usuarios de tenant
    // Primero intentar con superadmin, luego buscar cualquier token de tenant
    let token = globalThis.localStorage.getItem('superadmin_token');
    console.log('[TenantBootstrap] SuperAdmin token exists?', !!token);

    if (!token) {
      // Buscar cualquier token que empiece con 'mtkn_'
      const keys = Object.keys(globalThis.localStorage);
      const tenantKey = keys.find((k) => k.startsWith('mtkn_'));
      if (tenantKey) {
        token = globalThis.localStorage.getItem(tenantKey);
        console.log('[TenantBootstrap] Found tenant token:', tenantKey);
      }
    }

    console.log('[TenantBootstrap] Token exists?', !!token);
    console.log(
      '[TenantBootstrap] Token value:',
      token ? token.substring(0, 50) + '...' : 'NULL'
    );

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[TenantBootstrap] JWT Payload parsed:', payload);
        const tenantSlugFromToken = payload.tenant_slug;
        console.log(
          '[TenantBootstrap] tenant_slug from JWT:',
          tenantSlugFromToken
        );

        if (tenantSlugFromToken) {
          console.log(
            `[TenantBootstrap] ✅ Using tenant from JWT token: ${tenantSlugFromToken}`
          );
          return {
            type: 'query',
            value: tenantSlugFromToken,
            source: `JWT token: tenant_slug=${tenantSlugFromToken}`,
            priority: 1,
          };
        }
      } catch (error) {
        console.warn('[TenantBootstrap] Failed to parse JWT token:', error);
      }
    }

    const hostname = this.document.location.hostname;
    const subdomainMatch = hostname.match(/^([^.]+)\./);
    const subdomain = subdomainMatch ? subdomainMatch[1] : '';

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

    const mappedTenant = this.mapHostnameToTenant(hostname);
    if (mappedTenant) {
      return {
        type: 'hostname',
        value: mappedTenant,
        source: `hostname mapping: ${hostname} -> ${mappedTenant}`,
        priority: 3,
      };
    }

    return {
      type: 'default',
      value: this.config.defaultTenantSlug,
      source: `default configuration`,
      priority: 4,
    };
  }

  private mapHostnameToTenant(hostname: string): string {
    const hostnameMap: Record<string, string> = {
      localhost: '',
      'localhost:4200': '',
      'demo.example.com': 'demo',
    };
    return hostnameMap[hostname] || '';
  }

  private async loadTenantFromBackend(
    tenantSlug: string
  ): Promise<PublicTenantConfigResponse> {
    try {
      return await firstValueFrom(
        this.apiClient.get<PublicTenantConfigResponse>(
          `/api/public/tenant/${tenantSlug}`
        )
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          throw new HttpErrorResponse({
            error: { message: `Comercio "${tenantSlug}" no encontrado` },
            status: 404,
            statusText: 'Not Found',
            url: `/api/public/tenant/${tenantSlug}`,
          });
        }
        if (error.status === 409) {
          throw new HttpErrorResponse({
            error: {
              message: `Comercio "${tenantSlug}" en conflicto (no está listo)`,
            },
            status: 409,
            statusText: 'Conflict',
            url: `/api/public/tenant/${tenantSlug}`,
          });
        }
        throw error;
      }
      throw new Error(`Error cargando comercio: ${error}`);
    }
  }

  private mapBackendResponseToTenantConfig(
    response: PublicTenantConfigResponse
  ): TenantConfig {
    return {
      tenant: {
        id: response.tenant.id,
        slug: response.tenant.slug,
        displayName: response.tenant.displayName,
        status: response.tenant.status as any,
        plan: response.tenant.plan,
        branding: response.tenant.branding,
      },
      theme: response.theme || {
        primary: '#1976d2',
        accent: '#dc004e',
        logoUrl: '',
        faviconUrl: '/favicon.ico',
      },
      features: {
        ...response.features,
        ...response.appFeatures,
      },
      locale: response.locale || 'es-CO',
      currency: response.currency || 'COP',
      currencySymbol: response.currencySymbol,
      taxRate: response.taxRate,
      contact: response.contact,
      social: response.social,
      seo: response.seo,
    };
  }

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
            message: `El comercio "${attemptedSlug}" no fue encontrado en el sistema`,
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
              'El servidor está experimentando problemas. Por favor, intenta nuevamente.',
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
            message: 'No tienes permisos para acceder a este comercio.',
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
        message: error.message || 'Error desconocido al cargar el comercio',
        slug: attemptedSlug || undefined,
        timestamp: new Date(),
        retryable: false,
      };
      this._status.set('error');
    }

    this._error.set(tenantError);
  }

  private getCachedConfig(slug: string): TenantConfig | null {
    const cached = this.cache.get(slug);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL;
    if (isExpired) {
      this.cache.delete(slug);
      return null;
    }

    return cached.config;
  }

  private setCachedConfig(slug: string, config: TenantConfig): void {
    this.cache.set(slug, { config, timestamp: Date.now() });
  }

  private applyTenantConfiguration(config: TenantConfig): void {
    this.title.setTitle(config.tenant.displayName);
    this.updateMetaTags(config);
    this.applyThemeVariables(config);
    if (config.theme.faviconUrl) {
      this.updateFavicon(config.theme.faviconUrl);
    }
  }

  private updateMetaTags(config: TenantConfig): void {
    const description =
      config.tenant.description ||
      `Tienda online de ${config.tenant.displayName}`;

    this.meta.updateTag({ name: 'description', content: description });
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
    this.meta.updateTag({ name: 'theme-color', content: config.theme.primary });
  }

  private applyThemeVariables(config: TenantConfig): void {
    const root = this.document.documentElement;
    const theme = config.theme;

    root.style.setProperty('--tenant-primary-color', theme.primary);
    root.style.setProperty('--tenant-accent-color', theme.accent);

    if (theme.background) {
      root.style.setProperty('--tenant-background-color', theme.background);
    }
    if (theme.textColor) {
      root.style.setProperty('--tenant-text-color', theme.textColor);
    }
    if (theme.cssVars) {
      for (const [key, value] of Object.entries(theme.cssVars)) {
        root.style.setProperty(`--tenant-${key}`, value);
      }
    }

    root.style.setProperty('--mat-sys-primary', theme.primary);
    root.style.setProperty('--mat-sys-secondary', theme.accent);
  }

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

  private setDefaultTenantConfig(): void {
    this.applyTenantConfiguration(this.DEFAULT_TENANT_CONFIG);
    this._currentTenant.set(this.DEFAULT_TENANT_CONFIG);
    this._tenantConfig$.next(this.DEFAULT_TENANT_CONFIG);
    this._status.set('resolved');
  }

  getTenantSlug(): string | null {
    return this._currentTenant()?.tenant.slug || null;
  }

  getTenantId(): string | null {
    return this._currentTenant()?.tenant.id || null;
  }

  getTenantConfig(): TenantConfig | null {
    return this._currentTenant();
  }

  isTenantLoaded(): boolean {
    return this._currentTenant() !== null && this._status() === 'resolved';
  }

  async reloadTenant(newSlug?: string): Promise<void> {
    if (newSlug) {
      const url = new URL(this.document.location.href);
      url.searchParams.set('tenant', newSlug);
      this.document.location.href = url.toString();
    } else {
      await this.initialize();
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

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
    if (isPlatformBrowser(this.platformId)) {
      return this.initialize();
    }
  }
}
