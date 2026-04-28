import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TenantBootstrapService } from '../services/tenant-bootstrap.service';
import { TenantConfigService } from '../services/tenant-config.service';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantResolutionService } from '../services/tenant-resolution.service';
import { TenantStorageService } from '../services/tenant-storage.service';

describe('TenantContextService HTTP classification', () => {
  let service: TenantContextService;
  let tenantResolution: {
    isAdminContext: jest.Mock;
    getTenantSlug: jest.Mock;
  };

  beforeEach(() => {
    tenantResolution = {
      isAdminContext: jest.fn(() => true),
      getTenantSlug: jest.fn(() => null),
    };

    TestBed.configureTestingModule({
      providers: [
        TenantContextService,
        {
          provide: TenantBootstrapService,
          useValue: {
            currentTenant: () => null,
            isLoading: () => false,
            tenantConfig$: of(null),
          },
        },
        {
          provide: TenantConfigService,
          useValue: {
            config: undefined,
          },
        },
        {
          provide: TenantResolutionService,
          useValue: tenantResolution,
        },
        {
          provide: TenantStorageService,
          useValue: {
            set: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(TenantContextService);
  });

  it('debe tratar /admin/tenants como request protegida manejable', () => {
    expect(service.shouldHandleHttpRequest('/admin/tenants')).toBe(true);
    expect(service.shouldIncludeTenantHeaders('/admin/tenants')).toBe(false);
  });

  it('debe tratar /admin/settings como tenant-aware en host tenant', () => {
    tenantResolution.isAdminContext.mockReturnValue(false);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    expect(service.shouldHandleHttpRequest('/admin/settings')).toBe(true);
    expect(service.shouldIncludeTenantHeaders('/admin/settings')).toBe(true);
  });

  it('debe tratar /admin/users como tenant-aware en host tenant', () => {
    tenantResolution.isAdminContext.mockReturnValue(false);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    expect(service.shouldHandleHttpRequest('/admin/users')).toBe(true);
    expect(service.shouldIncludeTenantHeaders('/admin/users')).toBe(true);
  });

  it('debe tratar /admin/roles como tenant-aware en host tenant', () => {
    tenantResolution.isAdminContext.mockReturnValue(false);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    expect(service.shouldHandleHttpRequest('/admin/roles')).toBe(true);
    expect(service.shouldIncludeTenantHeaders('/admin/roles')).toBe(true);
  });

  it('debe tratar /superadmin/tenants como request protegida manejable', () => {
    expect(service.shouldHandleHttpRequest('/superadmin/tenants')).toBe(true);
    expect(service.shouldIncludeTenantHeaders('/superadmin/tenants')).toBe(
      false
    );
  });

  it('debe tratar /api/public/tenant/print3d como endpoint publico tenant-aware', () => {
    tenantResolution.isAdminContext.mockReturnValue(false);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    expect(service.shouldHandleHttpRequest('/api/public/tenant/print3d')).toBe(
      true
    );
    expect(
      service.shouldIncludeTenantHeaders('/api/public/tenant/print3d')
    ).toBe(true);
  });

  it('debe mantener /api/public/health sin X-Tenant-Slug', () => {
    expect(service.shouldHandleHttpRequest('/api/public/health')).toBe(true);
    expect(service.shouldIncludeTenantHeaders('/api/public/health')).toBe(
      false
    );
  });

  it('debe agregar tenant header a /api/auth/activate-account cuando el tenant viene del subdominio aunque no haya config cargada', () => {
    tenantResolution.isAdminContext.mockReturnValue(false);
    tenantResolution.getTenantSlug.mockReturnValue('print3d');

    expect(service.isGeneralAdminMode()).toBe(false);
    expect(service.shouldHandleHttpRequest('/api/auth/activate-account')).toBe(
      true
    );
    expect(
      service.shouldIncludeTenantHeaders('/api/auth/activate-account')
    ).toBe(true);
  });
});
