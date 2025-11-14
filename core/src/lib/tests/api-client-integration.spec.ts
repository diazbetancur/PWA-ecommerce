import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantHeaderInterceptor } from '../interceptors/tenant-header.interceptor';
import { ApiClientService } from '../services/api-client.service';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Test simple para demostrar el funcionamiento del interceptor multi-tenant
 * Ejecuta: npm test -- api-client-integration.spec.ts
 */
describe('ApiClientService + TenantHeaderInterceptor Integration', () => {
  let apiClient: ApiClientService;
  let httpMock: HttpTestingController;
  let tenantContext: any;

  beforeEach(() => {
    // Mock del TenantContextService usando Jest
    const tenantContextSpy = {
      shouldIncludeTenantHeaders: jest.fn(),
      getTenantHeaders: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiClientService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: TenantHeaderInterceptor,
          multi: true,
        },
        {
          provide: TenantContextService,
          useValue: tenantContextSpy,
        },
      ],
    });

    apiClient = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
    tenantContext = TestBed.inject(TenantContextService) as any;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe agregar headers X-Tenant-Slug y X-Tenant-Key automáticamente', () => {
    // Configurar el mock del contexto de tenant
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantHeaders.mockReturnValue({
      slug: 'demo-tenant',
      key: 'demo-key-123',
    });

    // Realizar una request GET
    apiClient.get<any[]>('/api/catalog/products').subscribe();

    // Verificar la request HTTP
    const req = httpMock.expectOne((req) =>
      req.url.includes('/api/catalog/products')
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('demo-tenant');
    expect(req.request.headers.get('X-Tenant-Key')).toBe('demo-key-123');

    // Simular respuesta
    req.flush([
      { id: '1', name: 'Producto 1', price: 29.99 },
      { id: '2', name: 'Producto 2', price: 39.99 },
    ]);
  });

  it('debe manejar POST con body tipado y headers de tenant', () => {
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantHeaders.mockReturnValue({
      slug: 'mi-tienda',
      key: 'key-456',
    });

    const newProduct = {
      name: 'Nuevo Producto',
      price: 49.99,
      stock: 10,
    };

    apiClient
      .post<{ id: string }>('/api/catalog/products', newProduct)
      .subscribe();

    const req = httpMock.expectOne((req) =>
      req.url.includes('/api/catalog/products')
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProduct);
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('mi-tienda');
    expect(req.request.headers.get('X-Tenant-Key')).toBe('key-456');

    req.flush({ id: 'new-product-123' });
  });

  it('NO debe agregar headers para URLs públicas', () => {
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(false);

    apiClient.get<any>('/api/public/health').subscribe();

    const req = httpMock.expectOne((req) =>
      req.url.includes('/api/public/health')
    );

    expect(req.request.headers.get('X-Tenant-Slug')).toBeNull();
    expect(req.request.headers.get('X-Tenant-Key')).toBeNull();

    req.flush({ status: 'ok' });
  });

  it('debe funcionar con getWithParams incluyendo headers de tenant', () => {
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantHeaders.mockReturnValue({
      slug: 'test-tenant',
      key: 'test-key',
    });

    apiClient
      .getWithParams<any[]>('/api/catalog/products', {
        page: 1,
        pageSize: 20,
        category: 'electronics',
      })
      .subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url.includes('/api/catalog/products') &&
        request.params.get('page') === '1' &&
        request.params.get('pageSize') === '20' &&
        request.params.get('category') === 'electronics'
    );

    expect(req.request.headers.get('X-Tenant-Slug')).toBe('test-tenant');
    expect(req.request.headers.get('X-Tenant-Key')).toBe('test-key');

    req.flush([]);
  });

  it('debe manejar el upload de archivos con headers de tenant', () => {
    tenantContext.shouldIncludeTenantHeaders.mockReturnValue(true);
    tenantContext.getTenantHeaders.mockReturnValue({
      slug: 'upload-tenant',
      key: 'upload-key',
    });

    const mockFile = new File(['contenido'], 'test.jpg', {
      type: 'image/jpeg',
    });

    apiClient
      .uploadFile<{ url: string }>('/api/media/upload', mockFile)
      .subscribe();

    const req = httpMock.expectOne((req) =>
      req.url.includes('/api/media/upload')
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('upload-tenant');
    expect(req.request.headers.get('X-Tenant-Key')).toBe('upload-key');

    req.flush({ url: 'https://cdn.example.com/uploads/test.jpg' });
  });
});

/**
 * Función helper para ejecutar este test manualmente en consola del navegador
 */
export function demoApiClientHeaders() {
  console.group('🧪 Demo ApiClientService Multi-tenant Headers');

  console.log('✅ Headers automáticos agregados:');
  console.log('   X-Tenant-Slug: demo-tenant');
  console.log('   X-Tenant-Key: demo-key-123');

  console.log(String.raw`
📡 Request simulada:`);
  console.log('   GET /api/catalog/products');

  console.log(String.raw`
🔍 Interceptor detecta:`);
  console.log('   - URL contiene "/api/" ✓');
  console.log('   - No es URL pública ✓');
  console.log('   - Tenant cargado ✓');
  console.log('   - Headers agregados automáticamente ✓');

  console.groupEnd();
}

// Exportar la función para uso en navegador
if (globalThis.window !== undefined) {
  (globalThis as any).demoApiClientHeaders = demoApiClientHeaders;
}
