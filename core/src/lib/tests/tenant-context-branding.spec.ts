jest.mock('@jsverse/transloco', () => ({
  TranslocoService: class TranslocoService {
    setActiveLang = jest.fn();
  },
}));

import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { ApiClientService } from '../services/api-client.service';
import { ManifestService } from '../services/manifest.service';
import { SeoService } from '../services/seo.service';
import { TenantBootstrapService } from '../services/tenant-bootstrap.service';
import { TenantConfigService } from '../services/tenant-config.service';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantResolutionService } from '../services/tenant-resolution.service';
import { TenantStorageService } from '../services/tenant-storage.service';
import { ThemeService } from '../services/theme.service';

describe('TenantContextService branding reactivity', () => {
  let tenantConfigService: TenantConfigService;
  let tenantContextService: TenantContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TenantConfigService,
        TenantContextService,
        {
          provide: ApiClientService,
          useValue: {
            getTenantConfig: jest.fn(),
          },
        },
        {
          provide: TranslocoService,
          useValue: {
            setActiveLang: jest.fn(),
          },
        },
        {
          provide: ThemeService,
          useValue: {
            applyTheme: jest.fn(),
          },
        },
        {
          provide: ManifestService,
          useValue: {
            setTenantManifest: jest.fn(),
          },
        },
        {
          provide: SeoService,
          useValue: {
            apply: jest.fn(),
          },
        },
        {
          provide: TenantBootstrapService,
          useValue: {
            currentTenant: () => null,
            isLoading: () => false,
            tenantConfig$: of(null),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: {
            getTenantSlug: jest.fn(() => 'print3d'),
            isAdminContext: jest.fn(() => false),
          },
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

    tenantConfigService = TestBed.inject(TenantConfigService);
    tenantContextService = TestBed.inject(TenantContextService);

    (tenantConfigService as unknown as { _config: unknown })._config = {
      tenant: {
        id: 'tenant-1',
        slug: 'print3d',
        displayName: 'Print 3D',
        branding: {
          logoUrl: 'branding/original-logo.webp',
          primaryColor: '#123456',
        },
      },
      theme: {
        primary: '#123456',
        accent: '#654321',
        logoUrl: 'branding/original-logo.webp',
        faviconUrl: 'branding/original-favicon.ico',
      },
      features: {},
      locale: 'es-CO',
      currency: 'COP',
      cdnBaseUrl: 'https://cdn.example.com/assets',
    };
  });

  it('updates the resolved tenant logo when runtime branding changes', () => {
    expect(tenantContextService.getResolvedTenantLogoUrl()).toBe(
      'https://cdn.example.com/assets/branding/original-logo.webp'
    );

    tenantConfigService.updateRuntimeBranding({
      logoUrl: 'branding/new-logo.webp',
      primaryColor: '#0f4c81',
    });

    expect(tenantContextService.getResolvedTenantLogoUrl()).toBe(
      'https://cdn.example.com/assets/branding/new-logo.webp'
    );
  });
});
