import {
  Component,
  inject,
  OnInit,
  Renderer2,
  DOCUMENT,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TenantContextService } from '@pwa/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-layout" [attr.data-tenant]="tenantSlug()">
      <!-- Global Loading Indicator -->
      @if (isLoading()) {
      <div class="global-loading">
        <div class="loading-spinner">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle
              class="path"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-miterlimit="10"
            />
          </svg>
        </div>
        <p>Cargando {{ displayName() }}...</p>
      </div>
      }

      <!-- Header -->
      <app-header></app-header>

      <!-- Main Content Area -->
      <main class="main-content" role="main">
        <!-- Breadcrumb Area (optional) -->
        <div class="breadcrumb-area">
          <div class="container">
            <!-- Breadcrumbs can be added here -->
          </div>
        </div>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>

        <!-- Back to Top Button -->
        @if (showBackToTop()) {
        <button
          class="back-to-top"
          (click)="scrollToTop()"
          aria-label="Volver arriba"
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        }
      </main>

      <!-- Footer -->
      <app-footer></app-footer>

      <!-- Tenant Debug Info (only in development) -->
      @if (isDebugMode() && currentTenant()) {
      <div class="tenant-debug">
        <details>
          <summary>🔧 Tenant Debug Info</summary>
          <pre>{{ tenantDebugInfo() | json }}</pre>
        </details>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .app-layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--tenant-background-color, #ffffff);
        color: var(--tenant-text-color, #1f2937);
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      /* Global Loading */
      .global-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        gap: 1rem;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        color: var(--tenant-primary-color, #3b82f6);
      }

      .spinner {
        animation: rotate 1s linear infinite;
        width: 100%;
        height: 100%;
      }

      .path {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: 0;
        stroke-linecap: round;
        animation: dash 1.5s ease-in-out infinite;
      }

      @keyframes rotate {
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes dash {
        0% {
          stroke-dasharray: 1, 150;
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: 90, 150;
          stroke-dashoffset: -35;
        }
        100% {
          stroke-dasharray: 90, 150;
          stroke-dashoffset: -124;
        }
      }

      .global-loading p {
        font-size: 0.875rem;
        color: var(--tenant-text-color, #6b7280);
        margin: 0;
      }

      /* Main Content */
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .breadcrumb-area {
        background: var(--tenant-breadcrumb-bg, #f9fafb);
        border-bottom: 1px solid var(--tenant-border-color, #e5e7eb);
        padding: 0.75rem 0;
        min-height: 48px;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      .page-content {
        flex: 1;
        position: relative;
        overflow-x: hidden;
      }

      /* Back to Top */
      .back-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 48px;
        height: 48px;
        border: none;
        border-radius: 50%;
        background: var(--tenant-primary-color, #3b82f6);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .back-to-top:hover {
        background: var(--tenant-primary-hover, #2563eb);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }

      .back-to-top:active {
        transform: translateY(0);
      }

      /* Tenant Debug */
      .tenant-debug {
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        max-width: 300px;
        background: #1f2937;
        color: #f9fafb;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        z-index: 50;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .tenant-debug details {
        padding: 0.5rem;
      }

      .tenant-debug summary {
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.5rem;
        background: #374151;
        margin: -0.5rem;
        margin-bottom: 0.5rem;
      }

      .tenant-debug pre {
        margin: 0;
        padding: 0.5rem;
        background: #111827;
        border-radius: 0.25rem;
        overflow-x: auto;
        font-size: 0.625rem;
        line-height: 1.4;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .back-to-top {
          bottom: 1rem;
          right: 1rem;
          width: 44px;
          height: 44px;
        }

        .tenant-debug {
          bottom: 0.5rem;
          left: 0.5rem;
          max-width: 250px;
        }
      }

      /* Tenant-specific theme classes */
      .app-layout[data-tenant] {
        /* Base tenant styling - specific overrides loaded dynamically */
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .app-layout {
          --tenant-border-color: #000000;
        }
      }
    `,
  ],
})
export class LayoutComponent implements OnInit {
  private readonly tenantContext = inject(TenantContextService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  // Reactive computed properties
  currentTenant = computed(() => this.tenantContext.getCurrentTenant());
  tenantSlug = computed(() => this.tenantContext.getTenantSlug());
  displayName = computed(
    () => this.currentTenant()?.displayName || 'PWA Store'
  );
  isLoading = computed(() => this.tenantContext.getTenantLoadingState());

  // Debug mode (in development)
  isDebugMode = computed(() => !this.isProductionMode());

  // Back to top visibility
  showBackToTop = computed(() => {
    // This could be enhanced with scroll position tracking
    return true; // Simplified for demo
  });

  // Tenant debug information
  tenantDebugInfo = computed(() => {
    const tenant = this.currentTenant();
    return {
      slug: this.tenantSlug(),
      displayName: tenant?.displayName,
      branding: tenant?.branding,
      loadedAt: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...',
    };
  });

  constructor() {
    // Apply global theme when tenant changes
    effect(() => {
      const tenant = this.currentTenant();
      if (tenant) {
        this.applyGlobalTenantTheme(tenant);
      }
    });

    // Update page title when tenant changes
    effect(() => {
      const displayName = this.displayName();
      this.document.title = `${displayName} - PWA Store`;
    });
  }

  ngOnInit(): void {
    // Apply initial theme
    const tenant = this.currentTenant();
    if (tenant) {
      this.applyGlobalTenantTheme(tenant);
    }

    // Add scroll listener for back-to-top (simplified)
    this.setupScrollListeners();
  }

  /**
   * Aplica el theme del tenant a nivel global del documento
   */
  private applyGlobalTenantTheme(tenant: any): void {
    const body = this.document.body;
    const root = this.document.documentElement;

    // Apply tenant class to body
    body.className = body.className.replaceAll(/tenant-\w+/g, '');
    this.renderer.addClass(body, `tenant-${this.tenantSlug()}`);

    // Apply branding colors as CSS custom properties
    if (tenant.branding) {
      const branding = tenant.branding;

      // Core colors
      this.renderer.setStyle(
        root,
        '--tenant-primary-color',
        branding.primaryColor || '#3b82f6'
      );
      this.renderer.setStyle(
        root,
        '--tenant-secondary-color',
        branding.secondaryColor || '#64748b'
      );
      this.renderer.setStyle(
        root,
        '--tenant-accent-color',
        branding.accentColor || '#ef4444'
      );
      this.renderer.setStyle(
        root,
        '--tenant-background-color',
        branding.backgroundColor || '#ffffff'
      );
      this.renderer.setStyle(
        root,
        '--tenant-text-color',
        branding.textColor || '#1f2937'
      );

      // Derived colors for consistency
      this.renderer.setStyle(
        root,
        '--tenant-primary-hover',
        this.darkenColor(branding.primaryColor || '#3b82f6', 0.1)
      );
      this.renderer.setStyle(
        root,
        '--tenant-border-color',
        this.adjustColorOpacity(branding.textColor || '#1f2937', 0.2)
      );
      this.renderer.setStyle(
        root,
        '--tenant-breadcrumb-bg',
        this.adjustColorOpacity(branding.backgroundColor || '#ffffff', 0.95)
      );
    }

    // Meta theme-color for mobile browsers
    this.updateMetaThemeColor(tenant.branding?.primaryColor || '#3b82f6');
  }

  /**
   * Actualiza el meta theme-color para navegadores móviles
   */
  private updateMetaThemeColor(color: string): void {
    let themeColorMeta = this.document.querySelector(
      'meta[name="theme-color"]'
    ) as HTMLMetaElement;

    if (!themeColorMeta) {
      themeColorMeta = this.renderer.createElement('meta');
      this.renderer.setAttribute(themeColorMeta, 'name', 'theme-color');
      this.renderer.appendChild(this.document.head, themeColorMeta);
    }

    this.renderer.setAttribute(themeColorMeta, 'content', color);
  }

  /**
   * Oscurece un color hex
   */
  private darkenColor(hex: string, factor: number): string {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);

    return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(
      g * (1 - factor)
    )}, ${Math.floor(b * (1 - factor))})`;
  }

  /**
   * Ajusta la opacidad de un color
   */
  private adjustColorOpacity(hex: string, opacity: number): string {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Configura listeners de scroll
   */
  private setupScrollListeners(): void {
    // Simplified scroll handler for back-to-top button
    // In a real implementation, you'd track scroll position
  }

  /**
   * Scroll suave al top
   */
  scrollToTop(): void {
    this.document.defaultView?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Detecta si estamos en modo producción
   */
  private isProductionMode(): boolean {
    return (
      !this.document.location.hostname.includes('localhost') &&
      !this.document.location.hostname.includes('127.0.0.1')
    );
  }
}
