import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';
import { AccountService, TenantAuthModalService } from '@pwa/features-account';

type HeaderThemeConfig = {
  tenant?: {
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
  theme?: {
    primary?: string;
    background?: string;
    textColor?: string;
  };
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly tenantContext = inject(TenantContextService);
  private readonly accountService = inject(AccountService);
  private readonly tenantAuthModal = inject(TenantAuthModalService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  isMobileMenuOpen = signal(false);
  isUserMenuOpen = signal(false);
  cartCount = signal(0); // TODO: Conectar con CartService

  logoUrl = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    const tenantLogo =
      config?.tenant.branding?.logoUrl || config?.theme?.logoUrl;

    // Si hay logo del tenant, úsalo
    if (tenantLogo) return tenantLogo;

    // Si hay tenant pero sin logo, usa el logo por defecto
    // const tenant = this.tenantContext.getCurrentTenant();
    // if (tenant)
    return '/assets/images/logoEcommerce.png';

    // Sin tenant, no hay logo
    // return '';
  });

  displayName = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.displayName || 'Tienda';
  });

  isAuthenticated = computed(() => this.accountService.state().isAuthenticated);

  constructor() {
    effect(() => {
      const config = this.tenantContext.getCurrentTenantConfig();
      if (config) {
        this.applyThemeVars(config);
      }
    });
  }

  private applyThemeVars(config: HeaderThemeConfig): void {
    const root = this.document.documentElement;
    const branding = config.tenant?.branding || {};
    const theme = config.theme || {};

    const primary = branding.primaryColor || theme.primary || '#3b82f6';
    const secondary = branding.secondaryColor || '#64748b';
    const bg = branding.backgroundColor || theme.background || '#ffffff';
    const text = branding.textColor || theme.textColor || '#374151';

    this.renderer.setStyle(root, '--primary-color', primary);
    this.renderer.setStyle(root, '--primary-hover', this.darken(primary, 10));
    this.renderer.setStyle(root, '--primary-light', this.lighten(primary, 95));
    this.renderer.setStyle(root, '--secondary-color', secondary);
    this.renderer.setStyle(root, '--bg-color', bg);
    this.renderer.setStyle(root, '--text-color', text);
    this.renderer.setStyle(
      root,
      '--border-color',
      'var(--tenant-border-color)'
    );
    this.renderer.setStyle(root, '--hover-bg', this.lighten(primary, 95));
    this.renderer.setStyle(
      root,
      '--danger-color',
      'var(--tenant-accent-color)'
    );
  }

  private lighten(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(
      255,
      Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100))
    );
    const g = Math.min(
      255,
      Math.floor(
        ((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * (percent / 100)
      )
    );
    const b = Math.min(
      255,
      Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * (percent / 100))
    );
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private darken(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
    const g = Math.max(
      0,
      Math.floor(((num >> 8) & 0x00ff) * (1 - percent / 100))
    );
    const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - percent / 100)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
    this.isUserMenuOpen.set(false);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  openAuthModal(tab: 'login' | 'register' = 'login'): void {
    this.tenantAuthModal.open(tab);
    this.closeMobileMenu();
  }

  async logout(): Promise<void> {
    await this.accountService.logout();
    this.closeUserMenu();
    this.closeMobileMenu();
  }
}
