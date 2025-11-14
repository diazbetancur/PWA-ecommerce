import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TenantContextService } from '@pwa/core';
import { App } from './app';

describe('App', () => {
  const mockTenantContextService = {
    getCurrentTenant: jest.fn(),
    getTenantConfig: jest.fn(),
    pwaBranding: jest.fn(),
  };

  beforeEach(async () => {
    // Mock globalThis.matchMedia para evitar errores en PwaInstallService
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    mockTenantContextService.getCurrentTenant.mockReturnValue(null);
    mockTenantContextService.getTenantConfig.mockReturnValue(null);
    mockTenantContextService.pwaBranding.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: TenantContextService, useValue: mockTenantContextService },
        Title,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should update page title when tenant is available', () => {
    const fixture = TestBed.createComponent(App);
    const titleService = TestBed.inject(Title);
    const tenant = {
      slug: 'test-tenant',
      displayName: 'Test Tenant',
    };

    mockTenantContextService.getCurrentTenant.mockReturnValue(tenant);
    mockTenantContextService.getTenantConfig.mockReturnValue(null);

    fixture.detectChanges();

    expect(titleService.getTitle()).toBe('Test Tenant');
  });
});
