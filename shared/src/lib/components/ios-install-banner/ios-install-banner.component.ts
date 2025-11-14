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
  template: `
    @if (shouldShow()) {
    <div class="ios-install-banner" [@slideUp]>
      <div class="banner-container">
        <!-- Logo del tenant -->
        <div class="banner-logo">
          @if (logoUrl(); as logo) {
          <img
            [src]="logo"
            [alt]="tenantName() + ' logo'"
            class="logo-image"
            (error)="onLogoError()"
          />
          } @else {
          <div class="logo-placeholder">
            <span class="material-icons">store</span>
          </div>
          }
        </div>

        <!-- Contenido del banner -->
        <div class="banner-content">
          <div class="banner-header">
            <h3 class="banner-title">
              Instala <strong>{{ tenantName() }}</strong>
            </h3>
            <button
              class="banner-close"
              (click)="dismiss()"
              aria-label="Cerrar"
              type="button"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="banner-instructions">
            <p class="instruction-text">
              Para una mejor experiencia, añade esta app a tu pantalla de
              inicio:
            </p>
            <ol class="instruction-list">
              <li>
                <span class="step-icon">1️⃣</span>
                Toca el botón
                <span class="ios-icon"
                  ><span class="material-icons">ios_share</span></span
                >
                en la barra del navegador
              </li>
              <li>
                <span class="step-icon">2️⃣</span>
                Desplázate y selecciona
                <strong>"Añadir a pantalla de inicio"</strong>
              </li>
            </ol>
          </div>

          <div class="banner-actions">
            <button
              class="action-btn action-primary"
              (click)="dismissPermanently()"
              type="button"
            >
              Entendido
            </button>
            <button
              class="action-btn action-secondary"
              (click)="dismiss()"
              type="button"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .ios-install-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .banner-container {
        background: rgba(28, 28, 30, 0.98);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 20px 16px;
        padding-bottom: calc(20px + env(safe-area-inset-bottom));
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        gap: 16px;
        max-width: 600px;
        margin: 0 auto;
      }

      .banner-logo {
        flex-shrink: 0;
      }

      .logo-image {
        width: 60px;
        height: 60px;
        border-radius: 13px;
        object-fit: cover;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }

      .logo-placeholder {
        width: 60px;
        height: 60px;
        border-radius: 13px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }

      .logo-placeholder .material-icons {
        color: white;
        font-size: 32px;
      }

      .banner-content {
        flex: 1;
        min-width: 0;
      }

      .banner-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .banner-title {
        margin: 0;
        font-size: 17px;
        font-weight: 400;
        color: white;
        line-height: 1.3;
      }

      .banner-title strong {
        font-weight: 600;
      }

      .banner-close {
        background: none;
        border: none;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.2s;
        flex-shrink: 0;
      }

      .banner-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .banner-close .material-icons {
        color: rgba(255, 255, 255, 0.6);
        font-size: 20px;
      }

      .banner-instructions {
        margin-bottom: 16px;
      }

      .instruction-text {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
      }

      .instruction-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .instruction-list li {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.5;
        margin-bottom: 8px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .instruction-list li:last-child {
        margin-bottom: 0;
      }

      .step-icon {
        flex-shrink: 0;
        font-size: 16px;
        line-height: 1.5;
      }

      .ios-icon {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        background: rgba(0, 122, 255, 0.15);
        border: 1px solid rgba(0, 122, 255, 0.3);
        border-radius: 4px;
        padding: 2px 4px;
        margin: 0 2px;
      }

      .ios-icon .material-icons {
        color: #0a84ff;
        font-size: 16px;
      }

      .banner-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .action-btn {
        flex: 1;
        min-width: 120px;
        padding: 10px 16px;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .action-primary {
        background: #0a84ff;
        color: white;
      }

      .action-primary:hover {
        background: #0077ed;
      }

      .action-primary:active {
        background: #006edb;
        transform: scale(0.98);
      }

      .action-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .action-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .action-secondary:active {
        background: rgba(255, 255, 255, 0.08);
        transform: scale(0.98);
      }

      @media (max-width: 374px) {
        .banner-container {
          padding: 16px 12px;
          gap: 12px;
        }

        .logo-image,
        .logo-placeholder {
          width: 50px;
          height: 50px;
        }

        .banner-title {
          font-size: 16px;
        }

        .instruction-text,
        .instruction-list li {
          font-size: 13px;
        }

        .action-btn {
          min-width: 100px;
          padding: 9px 12px;
          font-size: 14px;
        }
      }

      @media (min-width: 768px) {
        .banner-container {
          border-radius: 16px 16px 0 0;
        }
      }
    `,
  ],
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
        console.log('[IosInstallBannerComponent] Banner visible');
        console.log(
          '[IosInstallBannerComponent] Branding:',
          this.tenantBranding()
        );
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
