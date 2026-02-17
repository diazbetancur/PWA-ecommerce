import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { TenantContextService, PwaInstallService } from '@pwa/core';

/**
 * Componente de banner para instalación PWA en iOS
 * Se muestra solo cuando:
 * - El usuario está en iOS/iPadOS
 * - La PWA NO está instalada (standalone)
 * - El banner no ha sido descartado
 *
 * Diseño iOS-native con instrucciones de instalación específicas
 */
@Component({
  selector: 'lib-ios-install-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ios-install-banner.component.html',
  styleUrl: './ios-install-banner.component.scss',
})
export class IosInstallBannerComponent {
  private readonly pwaInstallService = inject(PwaInstallService);
  private readonly tenantContext = inject(TenantContextService);

  // Signals para control del componente
  private readonly _logoLoadError = signal(false);

  // Computed signals para datos del tenant
  protected readonly tenantBranding = computed(() =>
    this.tenantContext.pwaBranding()
  );

  protected readonly tenantName = computed(
    () => this.tenantBranding()?.name || 'esta aplicación'
  );

  protected readonly logoUrl = computed(() => {
    if (this._logoLoadError()) {
      return null;
    }
    const branding = this.tenantBranding();
    return branding?.logoUrl || branding?.pwaIconUrl || null;
  });

  // Signal para controlar visibilidad del banner
  protected readonly shouldShow = computed(() =>
    this.pwaInstallService.shouldShowIosBanner()
  );

  constructor() {
    // Effect para debug en desarrollo
    effect(() => {
      if (!this.isProduction() && this.shouldShow()) {
        this.tenantBranding();
      }
    });
  }

  /**
   * Descarta el banner temporalmente (solo esta sesión)
   */
  protected dismiss(): void {
    this.pwaInstallService.markBannerDismissed();
  }

  /**
   * Descarta el banner permanentemente (guarda en localStorage)
   */
  protected dismissPermanently(): void {
    this.pwaInstallService.markBannerDismissedPermanently();
  }

  /**
   * Maneja error de carga del logo
   */
  protected onLogoError(): void {
    this._logoLoadError.set(true);
  }

  /**
   * Verifica si está en producción
   */
  private isProduction(): boolean {
    return (
      typeof globalThis !== 'undefined' &&
      globalThis.location?.hostname !== 'localhost'
    );
  }
}
