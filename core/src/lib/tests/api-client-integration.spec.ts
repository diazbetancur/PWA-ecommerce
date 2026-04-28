import {
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { APP_ENV } from '../config/app-env.token';
import { DEFAULT_APP_ERROR_USER_MESSAGE } from '../errors/app-error';
import { mapErrorToAppError } from '../errors/http-error.mapper';
import { authTenantInterceptor } from '../http/auth-tenant.interceptor';
import { SILENT_HTTP_CONTEXT } from '../http/http-context.tokens';
import { ApiClientService } from '../services/api-client.service';
import { LoaderService } from '../services/loader.service';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantResolutionService } from '../services/tenant-resolution.service';

/**
 * Test simple para demostrar el funcionamiento del interceptor HTTP activo.
 */
describe('ApiClientService + authTenantInterceptor Integration', () => {
  let apiClient: ApiClientService;
  let httpMock: HttpTestingController;
  let loader: LoaderService;
  let auth: {
    token: string | null;
    clear: jest.Mock;
  };
  let tenantContext: {
    getTenantSlug: jest.Mock;
    shouldHandleHttpRequest: jest.Mock;
    shouldIncludeTenantHeaders: jest.Mock;
  };
  let tenantResolution: {
    getTenantSlug: jest.Mock;
    isAdminContext: jest.Mock;
  };
  let router: {
    navigateByUrl: jest.Mock;
  };

  beforeEach(() => {
    auth = {
      token: 'token-123',
      clear: jest.fn(),
    };

    tenantContext = {
      getTenantSlug: jest.fn(),
      shouldHandleHttpRequest: jest.fn(),
      shouldIncludeTenantHeaders: jest.fn(),
    };

    tenantResolution = {
      getTenantSlug: jest.fn(),
      isAdminContext: jest.fn(),
    };

    router = {
      navigateByUrl: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTenantInterceptor])),
        provideHttpClientTesting(),
        ApiClientService,
        {
          provide: APP_ENV,
          useValue: {
            environmentName: 'dev',
            production: false,
            apiBaseUrl: 'https://api.example.test',
            publicAssetBaseUrl: '',
            enableServiceWorker: false,
            enableSSR: false,
            logLevel: 'debug',
            featureFlags: {},
            enableConsoleLogging: false,
            useTenantHeader: true,
          },
        },
        {
          provide: AuthService,
          useValue: auth,
        },
        {
          provide: TenantContextService,
          useValue: tenantContext,
        },
        {
          provide: TenantResolutionService,
          useValue: tenantResolution,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });

    apiClient = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
    loader = TestBed.inject(LoaderService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    httpMock.verify();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debe agregar Authorization, X-Tenant-Slug y X-Correlation-Id', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue('demo-tenant');
    tenantResolution.getTenantSlug.mockReturnValue('demo-tenant');

    apiClient.get<any[]>('/api/catalog/products').subscribe();

    const req = httpMock.expectOne((req) =>
      req.url.includes('/api/catalog/products')
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('demo-tenant');
    expect(req.request.headers.getAll('X-Tenant-Slug')).toEqual([
      'demo-tenant',
    ]);
    expect(req.request.headers.get('X-Correlation-Id')).toBeTruthy();

    req.flush([
      { id: '1', name: 'Producto 1', price: 29.99 },
      { id: '2', name: 'Producto 2', price: 39.99 },
    ]);
  });

  it('debe agregar Authorization a /admin/tenants sin X-Tenant-Slug', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(false);
    tenantContext.getTenantSlug.mockReturnValue(null);
    tenantResolution.getTenantSlug.mockReturnValue(null);

    apiClient
      .get('/admin/tenants', {
        params: { page: 1, pageSize: 20 },
      })
      .subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes('/admin/tenants')
    );

    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req.request.headers.get('X-Tenant-Slug')).toBeNull();
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('20');
    expect(req.request.params.has('tenant')).toBe(false);
    expect(req.request.params.has('store')).toBe(false);

    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  });

  it('debe agregar Authorization y X-Tenant-Slug a /admin/settings en contexto tenant', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue(null);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    apiClient.get('/admin/settings').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes('/admin/settings')
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('print3d');
    expect(req.request.headers.get('X-Correlation-Id')).toBeTruthy();
    expect(req.request.params.has('tenant')).toBe(false);
    expect(req.request.params.has('store')).toBe(false);

    req.flush({ branding: {}, contact: {}, social: {} });
  });

  it('debe agregar X-Tenant-Slug a /api/public/tenant/print3d sin Authorization', () => {
    auth.token = null;
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue(null);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    apiClient.get('/api/public/tenant/print3d').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes('/api/public/tenant/print3d')
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBeNull();
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('print3d');
    expect(req.request.headers.get('X-Correlation-Id')).toBeTruthy();
    expect(req.request.params.has('tenant')).toBe(false);
    expect(req.request.params.has('store')).toBe(false);

    req.flush({ tenant: { slug: 'print3d' } });
  });

  it('debe agregar X-Tenant-Slug a /api/auth/activate-account sin Authorization', () => {
    auth.token = null;
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue(null);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    apiClient
      .post('/api/auth/activate-account', {
        token: 'activation-token',
        password: 'Password.123',
        confirmPassword: 'Password.123',
      })
      .subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes('/api/auth/activate-account')
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBeNull();
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('print3d');
    expect(req.request.headers.get('X-Correlation-Id')).toBeTruthy();
    expect(req.request.params.has('tenant')).toBe(false);
    expect(req.request.params.has('store')).toBe(false);

    req.flush({ message: 'Cuenta activada correctamente.' });
  });

  it('no debe agregar X-Tenant-Slug para endpoints públicos', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(false);

    apiClient.get<any>('/api/public/health').subscribe();

    const req = httpMock.expectOne((req) =>
      req.url.includes('/api/public/health')
    );

    expect(req.request.headers.get('X-Tenant-Slug')).toBeNull();
    expect(req.request.headers.get('X-Correlation-Id')).toBeTruthy();

    req.flush({ status: 'ok' });
  });

  it('debe mostrar loader para requests no silenciosas', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue('tenant-loader');
    tenantResolution.getTenantSlug.mockReturnValue('tenant-loader');

    apiClient.get('/api/catalog/products').subscribe();

    expect(loader.activeRequestCount()).toBe(1);

    jest.advanceTimersByTime(281);

    expect(loader.isVisible()).toBe(true);

    const req = httpMock.expectOne((request) =>
      request.url.includes('/api/catalog/products')
    );
    req.flush([]);

    expect(loader.activeRequestCount()).toBe(0);

    jest.advanceTimersByTime(401);

    expect(loader.isVisible()).toBe(false);
  });

  it('no debe mostrar loader para requests silenciosas', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue('tenant-silent');
    tenantResolution.getTenantSlug.mockReturnValue('tenant-silent');

    apiClient
      .get('/api/catalog/products', {
        context: new HttpContext().set(SILENT_HTTP_CONTEXT, true),
      })
      .subscribe();

    jest.advanceTimersByTime(250);

    expect(loader.activeRequestCount()).toBe(0);
    expect(loader.isVisible()).toBe(false);

    const req = httpMock.expectOne((request) =>
      request.url.includes('/api/catalog/products')
    );
    req.flush([]);
  });

  it('no debe inyectar tenant ni store por query params', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue('tenant-queryless');
    tenantResolution.getTenantSlug.mockReturnValue('tenant-queryless');

    apiClient
      .getWithParams('/api/catalog/products', {
        page: 1,
        pageSize: 20,
      })
      .subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.includes('/api/catalog/products')
    );

    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('20');
    expect(req.request.params.has('tenant')).toBe(false);
    expect(req.request.params.has('store')).toBe(false);

    req.flush([]);
  });

  it('debe normalizar errores de red y servicio no disponible', () => {
    const networkError = mapErrorToAppError(
      new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error',
      })
    );
    const unavailableError = mapErrorToAppError(
      new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        error: { title: 'Backend down' },
      })
    );

    expect(networkError.code).toBe('NETWORK_ERROR');
    expect(networkError.userMessage).toBe(DEFAULT_APP_ERROR_USER_MESSAGE);
    expect(unavailableError.code).toBe('SERVICE_UNAVAILABLE');
    expect(unavailableError.userMessage).toBe(DEFAULT_APP_ERROR_USER_MESSAGE);
  });

  it('debe limpiar auth y redirigir en 401 sin query params', () => {
    tenantContext.shouldHandleHttpRequest.mockReturnValue(true);
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantSlug.mockReturnValue('tenant-auth');
    tenantResolution.getTenantSlug.mockReturnValue('tenant-auth');
    tenantResolution.isAdminContext.mockReturnValue(false);

    apiClient.get('/api/orders').subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne((request) =>
      request.url.includes('/api/orders')
    );

    req.flush(
      { title: 'Unauthorized' },
      {
        status: 401,
        statusText: 'Unauthorized',
      }
    );

    expect(auth.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/account/login');
  });
});
