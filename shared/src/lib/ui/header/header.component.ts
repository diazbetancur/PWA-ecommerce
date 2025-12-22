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
import { AccountService } from '@pwa/features-account';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header" [class.menu-open]="isMobileMenuOpen()">
      <div class="header-container">
        <!-- Logo -->
        <a routerLink="/" class="logo">
          @if (logoUrl(); as logo) {
          <img [src]="logo" [alt]="displayName()" class="logo-img" />
          } @else {
          <span class="logo-text">{{ displayName() }}</span>
          }
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-desktop">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >Inicio</a
          >
          <a routerLink="/catalog" routerLinkActive="active">Productos</a>
        </nav>

        <!-- Actions -->
        <div class="header-actions">
          <!-- Cart -->
          <a
            routerLink="/cart"
            class="action-btn cart-btn"
            aria-label="Carrito"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
              />
            </svg>
            @if (cartCount() > 0) {
            <span class="cart-badge">{{ cartCount() }}</span>
            }
          </a>

          <!-- User -->
          @if (isAuthenticated()) {
          <div class="user-menu-wrapper">
            <button
              class="action-btn user-btn"
              (click)="toggleUserMenu()"
              aria-label="Mi cuenta"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            @if (isUserMenuOpen()) {
            <div class="user-dropdown" (click)="closeUserMenu()">
              <a routerLink="/account/profile">Mi Perfil</a>
              <a routerLink="/orders">Mis Pedidos</a>
              <button class="logout-btn" (click)="logout()">
                Cerrar Sesión
              </button>
            </div>
            }
          </div>
          } @else {
          <a routerLink="/account/login" class="action-btn login-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="login-text">Ingresar</span>
          </a>
          }

          <!-- Mobile Menu Toggle -->
          <button
            class="menu-toggle"
            (click)="toggleMobileMenu()"
            aria-label="Menú"
          >
            <span class="menu-line"></span>
            <span class="menu-line"></span>
            <span class="menu-line"></span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      @if (isMobileMenuOpen()) {
      <nav class="nav-mobile">
        <a
          routerLink="/"
          (click)="closeMobileMenu()"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Inicio
        </a>
        <a
          routerLink="/catalog"
          (click)="closeMobileMenu()"
          routerLinkActive="active"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Productos
        </a>
        <a
          routerLink="/cart"
          (click)="closeMobileMenu()"
          routerLinkActive="active"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
            />
          </svg>
          Carrito @if (cartCount() > 0) {
          <span class="mobile-badge">{{ cartCount() }}</span>
          }
        </a>
        @if (isAuthenticated()) {
        <a routerLink="/account/profile" (click)="closeMobileMenu()">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Mi Cuenta
        </a>
        <button class="mobile-logout" (click)="logout(); closeMobileMenu()">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            />
          </svg>
          Cerrar Sesión
        </button>
        } @else {
        <a
          routerLink="/account/login"
          (click)="closeMobileMenu()"
          class="mobile-login"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
            />
          </svg>
          Ingresar
        </a>
        }
      </nav>
      }
    </header>
  `,
  styles: [
    `
      .header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--bg-color, #fff);
        border-bottom: 1px solid var(--border-color, #e5e7eb);
      }

      .header-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 1rem;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      /* Logo */
      .logo {
        display: flex;
        align-items: center;
        text-decoration: none;
        flex-shrink: 0;
      }

      .logo-img {
        height: 36px;
        width: auto;
        max-width: 140px;
        object-fit: contain;
      }

      .logo-text {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--primary-color, #3b82f6);
      }

      /* Desktop Nav */
      .nav-desktop {
        display: none;
        gap: 0.5rem;
      }

      @media (min-width: 768px) {
        .nav-desktop {
          display: flex;
        }
      }

      .nav-desktop a {
        padding: 0.5rem 1rem;
        color: var(--text-color, #374151);
        text-decoration: none;
        font-size: 0.9375rem;
        font-weight: 500;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .nav-desktop a:hover {
        background: var(--hover-bg, #f3f4f6);
      }

      .nav-desktop a.active {
        color: var(--primary-color, #3b82f6);
        background: var(--primary-light, #eff6ff);
      }

      /* Header Actions */
      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: none;
        border: none;
        border-radius: 0.5rem;
        color: var(--text-color, #374151);
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: var(--hover-bg, #f3f4f6);
      }

      .action-btn svg {
        width: 22px;
        height: 22px;
      }

      .cart-btn {
        position: relative;
      }

      .cart-badge {
        position: absolute;
        top: 0;
        right: 0;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        background: var(--primary-color, #3b82f6);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 600;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .login-btn {
        padding: 0.5rem 1rem;
        background: var(--primary-color, #3b82f6);
        color: #fff !important;
        border-radius: 0.5rem;
      }

      .login-btn:hover {
        background: var(--primary-hover, #2563eb);
      }

      .login-text {
        display: none;
        font-size: 0.875rem;
        font-weight: 500;
      }

      @media (min-width: 640px) {
        .login-text {
          display: inline;
        }
      }

      /* User Menu */
      .user-menu-wrapper {
        position: relative;
      }

      .user-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 180px;
        background: #fff;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 0.5rem;
        z-index: 50;
      }

      .user-dropdown a,
      .user-dropdown button {
        display: block;
        width: 100%;
        padding: 0.625rem 0.875rem;
        text-align: left;
        color: var(--text-color, #374151);
        text-decoration: none;
        font-size: 0.875rem;
        border-radius: 0.375rem;
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.15s;
      }

      .user-dropdown a:hover,
      .user-dropdown button:hover {
        background: var(--hover-bg, #f3f4f6);
      }

      .logout-btn {
        color: #dc2626 !important;
        border-top: 1px solid var(--border-color, #e5e7eb);
        margin-top: 0.25rem;
        padding-top: 0.625rem;
      }

      /* Mobile Menu Toggle */
      .menu-toggle {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
      }

      @media (min-width: 768px) {
        .menu-toggle {
          display: none;
        }
      }

      .menu-line {
        width: 20px;
        height: 2px;
        background: var(--text-color, #374151);
        border-radius: 1px;
        transition: all 0.3s;
      }

      .menu-open .menu-line:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }

      .menu-open .menu-line:nth-child(2) {
        opacity: 0;
      }

      .menu-open .menu-line:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
      }

      /* Mobile Navigation */
      .nav-mobile {
        display: flex;
        flex-direction: column;
        padding: 0.5rem;
        border-top: 1px solid var(--border-color, #e5e7eb);
        background: var(--bg-color, #fff);
      }

      @media (min-width: 768px) {
        .nav-mobile {
          display: none;
        }
      }

      .nav-mobile a,
      .nav-mobile button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        color: var(--text-color, #374151);
        text-decoration: none;
        font-size: 0.9375rem;
        font-weight: 500;
        border-radius: 0.5rem;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;
      }

      .nav-mobile a:hover,
      .nav-mobile button:hover {
        background: var(--hover-bg, #f3f4f6);
      }

      .nav-mobile a.active {
        color: var(--primary-color, #3b82f6);
        background: var(--primary-light, #eff6ff);
      }

      .nav-mobile svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .mobile-badge {
        margin-left: auto;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        background: var(--primary-color, #3b82f6);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mobile-login {
        margin-top: 0.5rem;
        background: var(--primary-color, #3b82f6) !important;
        color: #fff !important;
      }

      .mobile-logout {
        color: #dc2626 !important;
        margin-top: 0.5rem;
        border-top: 1px solid var(--border-color, #e5e7eb);
        padding-top: 0.875rem !important;
      }
    `,
  ],
})
export class HeaderComponent {
  private readonly tenantContext = inject(TenantContextService);
  private readonly accountService = inject(AccountService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  isMobileMenuOpen = signal(false);
  isUserMenuOpen = signal(false);
  cartCount = signal(0); // TODO: Conectar con CartService

  logoUrl = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.tenant.branding?.logoUrl || config?.theme?.logoUrl || '';
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

  private applyThemeVars(config: any): void {
    const root = this.document.documentElement;
    const branding = config.tenant?.branding || {};
    const theme = config.theme || {};

    const primary = branding.primaryColor || theme.primary || '#3b82f6';
    const secondary = branding.secondaryColor || '#64748b';
    const bg = branding.backgroundColor || theme.background || '#ffffff';

    this.renderer.setStyle(root, '--primary-color', primary);
    this.renderer.setStyle(root, '--primary-hover', this.darken(primary, 10));
    this.renderer.setStyle(root, '--primary-light', this.lighten(primary, 95));
    this.renderer.setStyle(root, '--secondary-color', secondary);
    this.renderer.setStyle(root, '--bg-color', bg);
    this.renderer.setStyle(root, '--text-color', '#374151');
    this.renderer.setStyle(root, '--border-color', '#e5e7eb');
    this.renderer.setStyle(root, '--hover-bg', '#f3f4f6');
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

  async logout(): Promise<void> {
    await this.accountService.logout();
    this.closeUserMenu();
    this.closeMobileMenu();
  }
}
