import {
  Component,
  inject,
  OnInit,
  Renderer2,
  computed,
  effect,
  DOCUMENT
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-header">
      <div class="header-container">
        <!-- Logo y Branding -->
        <div class="brand-section">
          <a routerLink="/" class="brand-link">
            @if (logoUrl(); as logo) {
              <img
                [src]="logo"
                [alt]="displayName() + ' Logo'"
                class="brand-logo"
                loading="lazy"
                (error)="onLogoError()"
              />
            } @else {
              <div class="brand-text">{{ displayName() }}</div>
            }
          </a>
        </div>

        <!-- Navigation -->
        <nav class="main-nav">
          <ul class="nav-list">
            <li><a routerLink="/catalog" routerLinkActive="active">Catálogo</a></li>
            <li><a routerLink="/about" routerLinkActive="active">Acerca de</a></li>
            <li><a routerLink="/contact" routerLinkActive="active">Contacto</a></li>
          </ul>
        </nav>

        <!-- User Actions -->
        <div class="user-actions">
          <button class="cart-btn" aria-label="Carrito de compras">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6m-9 0h8"/>
            </svg>
            <span class="cart-count">0</span>
          </button>

          <button class="user-btn" aria-label="Mi cuenta">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          class="mobile-menu-toggle"
          (click)="toggleMobileMenu()"
          [attr.aria-expanded]="isMobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>

      <!-- Mobile Menu -->
      @if (isMobileMenuOpen) {
        <div class="mobile-menu">
          <nav class="mobile-nav">
            <a routerLink="/catalog" (click)="closeMobileMenu()">Catálogo</a>
            <a routerLink="/about" (click)="closeMobileMenu()">Acerca de</a>
            <a routerLink="/contact" (click)="closeMobileMenu()">Contacto</a>
          </nav>
        </div>
      }
    </header>
  `,
  styles: [`
    .app-header {
      background: var(--tenant-header-bg, #ffffff);
      border-bottom: 1px solid var(--tenant-border-color, #e5e7eb);
      box-shadow: var(--tenant-header-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      position: sticky;
      top: 0;
      z-index: 50;
      transition: all 0.3s ease;
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }

    /* Brand Section */
    .brand-section {
      flex-shrink: 0;
    }

    .brand-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: inherit;
    }

    .brand-logo {
      height: 40px;
      width: auto;
      max-width: 160px;
      object-fit: contain;
      transition: opacity 0.2s ease;
    }

    .brand-logo:hover {
      opacity: 0.8;
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--tenant-primary-color, #1f2937);
      letter-spacing: -0.025em;
    }

    /* Navigation */
    .main-nav {
      display: none;
      flex: 1;
      justify-content: center;
      max-width: 400px;
      margin: 0 2rem;
    }

    @media (min-width: 768px) {
      .main-nav {
        display: flex;
      }
    }

    .nav-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 2rem;
    }

    .nav-list a {
      color: var(--tenant-text-color, #374151);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-list a:hover,
    .nav-list a.active {
      color: var(--tenant-primary-color, #3b82f6);
      background: var(--tenant-primary-light, #eff6ff);
    }

    /* User Actions */
    .user-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cart-btn,
    .user-btn {
      position: relative;
      background: none;
      border: 1px solid var(--tenant-border-color, #d1d5db);
      border-radius: 0.5rem;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--tenant-text-color, #374151);
      transition: all 0.2s ease;
    }

    .cart-btn:hover,
    .user-btn:hover {
      background: var(--tenant-primary-light, #f3f4f6);
      border-color: var(--tenant-primary-color, #3b82f6);
      color: var(--tenant-primary-color, #3b82f6);
    }

    .cart-count {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--tenant-accent-color, #ef4444);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    /* Mobile Menu */
    .mobile-menu-toggle {
      display: flex;
      flex-direction: column;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      gap: 4px;
    }

    @media (min-width: 768px) {
      .mobile-menu-toggle {
        display: none;
      }
    }

    .hamburger-line {
      width: 24px;
      height: 2px;
      background: var(--tenant-text-color, #374151);
      border-radius: 1px;
      transition: all 0.2s ease;
    }

    .mobile-menu {
      display: block;
      background: var(--tenant-header-bg, #ffffff);
      border-top: 1px solid var(--tenant-border-color, #e5e7eb);
      padding: 1rem;
    }

    @media (min-width: 768px) {
      .mobile-menu {
        display: none;
      }
    }

    .mobile-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .mobile-nav a {
      color: var(--tenant-text-color, #374151);
      text-decoration: none;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .mobile-nav a:hover {
      background: var(--tenant-primary-light, #f3f4f6);
      color: var(--tenant-primary-color, #3b82f6);
    }

    /* Loading skeleton for logo */
    .brand-logo[src=""] {
      background: var(--tenant-skeleton-color, #f3f4f6);
      border-radius: 4px;
      animation: skeleton-pulse 1.5s ease-in-out infinite alternate;
    }

    @keyframes skeleton-pulse {
      0% { opacity: 1; }
      100% { opacity: 0.4; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  private readonly tenantContext = inject(TenantContextService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  // Reactive data from tenant context
  logoUrl = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.branding?.logoUrl || tenant?.branding?.headerLogo || '';
  });

  displayName = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.displayName || 'PWA Store';
  });

  // Computed brand colors
  brandColors = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.branding || {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#ef4444',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    };
  });

  // Mobile menu state
  isMobileMenuOpen = false;

  constructor() {
    // Effect to apply CSS variables when tenant changes
    effect(() => {
      const colors = this.brandColors();
      this.applyTenantStyles(colors);
    });
  }

  ngOnInit(): void {
    // Initial styles application
    const colors = this.brandColors();
    this.applyTenantStyles(colors);
  }

  /**
   * Aplica los estilos CSS del tenant al documento
   */
  private applyTenantStyles(branding: any): void {
    const root = this.document.documentElement;

    // Apply CSS custom properties
    this.renderer.setStyle(root, '--tenant-primary-color', branding.primaryColor);
    this.renderer.setStyle(root, '--tenant-secondary-color', branding.secondaryColor);
    this.renderer.setStyle(root, '--tenant-accent-color', branding.accentColor);
    this.renderer.setStyle(root, '--tenant-background-color', branding.backgroundColor);
    this.renderer.setStyle(root, '--tenant-text-color', branding.textColor);

    // Derived colors
    this.renderer.setStyle(root, '--tenant-primary-light', this.lightenColor(branding.primaryColor, 0.9));
    this.renderer.setStyle(root, '--tenant-border-color', this.lightenColor(branding.textColor, 0.8));
    this.renderer.setStyle(root, '--tenant-header-bg', branding.backgroundColor);
    this.renderer.setStyle(root, '--tenant-header-shadow', '0 1px 3px rgba(0, 0, 0, 0.1)');
    this.renderer.setStyle(root, '--tenant-skeleton-color', this.lightenColor(branding.textColor, 0.95));
  }

  /**
   * Utility para aclarar colores
   */
  private lightenColor(hex: string, opacity: number): string {
    // Convert hex to RGB
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Manejo de error en carga de logo
   */
  onLogoError(): void {
    console.warn('Error loading tenant logo, falling back to text branding');
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
