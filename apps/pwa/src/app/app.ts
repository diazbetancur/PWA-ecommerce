import { Component, DOCUMENT, effect, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DynamicPwaAssetsService, TenantContextService } from '@pwa/core';
import { IosInstallBannerComponent } from '@pwa/shared';

@Component({
  imports: [RouterModule, IosInstallBannerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly tenantContext = inject(TenantContextService);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly dynamicPwaAssets = inject(DynamicPwaAssetsService);

  constructor() {
    // Effect para aplicar branding PWA cuando el tenant cambia
    effect(() => {
      const branding = this.tenantContext.pwaBranding();
      if (branding) {
        // Pre-cargar assets del branding antes de aplicarlos
        this.dynamicPwaAssets
          .preloadBrandingAssets(branding)
          .then(() => {
            this.dynamicPwaAssets.applyBranding(branding);
          })
          .catch((error) => {
            // Aplicar de todas formas aunque fallen algunas imágenes
            this.dynamicPwaAssets.applyBranding(branding);
          });
      }
    });
  }

  ngOnInit(): void {
    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    const tenant = this.tenantContext.getCurrentTenant();
    if (tenant?.displayName) {
      this.titleService.setTitle(tenant.displayName);

      // Actualizar meta description si existe
      const tenantConfig = this.tenantContext.getTenantConfig();
      const seoConfig = tenantConfig?.seo;
      const description = seoConfig ? seoConfig['description'] : undefined;
      if (description && typeof description === 'string') {
        let metaDescription = this.document.querySelector(
          'meta[name="description"]'
        );
        if (!metaDescription) {
          metaDescription = this.document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          this.document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);
      }
    }
  }
}
