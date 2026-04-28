jest.mock('@jsverse/transloco', () => ({
  TranslocoService: class TranslocoService {
    setActiveLang = jest.fn();
  },
}));

import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ApiClientService } from '../services/api-client.service';
import { ManifestService } from '../services/manifest.service';
import { SeoService } from '../services/seo.service';
import { TenantConfigService } from '../services/tenant-config.service';
import { TenantResolutionService } from '../services/tenant-resolution.service';
import { ThemeService } from '../services/theme.service';

describe('TenantConfigService runtime branding sync', () => {
  let service: TenantConfigService;
  let theme: { applyTheme: jest.Mock };
  let manifest: { setTenantManifest: jest.Mock };
  let seo: { apply: jest.Mock };

  beforeEach(() => {
    theme = {
      applyTheme: jest.fn(),
    };

    manifest = {
      setTenantManifest: jest.fn(),
    };

    seo = {
      apply: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TenantConfigService,
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
          useValue: theme,
        },
        {
          provide: ManifestService,
          useValue: manifest,
        },
        {
          provide: SeoService,
          useValue: seo,
        },
        {
          provide: TenantResolutionService,
          useValue: {
            getTenantSlug: jest.fn(() => 'print3d'),
          },
        },
      ],
    });

    service = TestBed.inject(TenantConfigService);
    (service as unknown as { _config: unknown })._config = {
      tenant: {
        id: 'tenant-1',
        slug: 'print3d',
        displayName: 'Print 3D',
        branding: {
          logoUrl: 'old-logo.png',
          faviconUrl: 'old-favicon.png',
          primaryColor: '#111111',
          backgroundColor: '#ffffff',
        },
      },
      theme: {
        primary: '#111111',
        accent: '#222222',
        logoUrl: 'old-logo.png',
        faviconUrl: 'old-favicon.png',
      },
      features: {},
      locale: 'es-CO',
      currency: 'COP',
      cdnBaseUrl: 'https://cdn.example.com/assets',
    };
  });

  it('updates the current tenant branding and reapplies runtime side effects', () => {
    service.updateRuntimeBranding({
      logoUrl: 'branding/new-logo.webp',
      faviconUrl: 'branding/new-favicon.ico',
      primaryColor: '#0f4c81',
      backgroundColor: '#f5f7fb',
    });

    expect(service.config?.tenant.branding?.logoUrl).toBe(
      'branding/new-logo.webp'
    );
    expect(service.config?.theme.logoUrl).toBe('branding/new-logo.webp');
    expect(service.config?.theme.primary).toBe('#0f4c81');
    expect(theme.applyTheme).toHaveBeenCalledWith(service.config?.theme);
    expect(manifest.setTenantManifest).toHaveBeenCalledWith(service.config);
    expect(seo.apply).toHaveBeenCalledWith(service.config);
  });
});
