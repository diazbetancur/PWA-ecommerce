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
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
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
