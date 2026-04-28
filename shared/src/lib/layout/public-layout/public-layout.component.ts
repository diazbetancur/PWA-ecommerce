import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  PublicPopupService,
  StorePopupResponse,
  TenantContextService,
} from '@pwa/core';
import {
  FooterComponent,
  HeaderComponent,
  SitePopupComponent,
  SitePopupData,
  WhatsappButtonComponent,
} from '../../ui';

@Component({
  selector: 'lib-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    SitePopupComponent,
    WhatsappButtonComponent,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly tenantContext = inject(TenantContextService);
  private readonly publicPopupService = inject(PublicPopupService);

  readonly activePopup = signal<SitePopupData | null>(null);
  readonly showPopup = signal(false);

  private loadedPopupForTenant: string | null = null;

  constructor() {
    effect(() => {
      const isReady = this.tenantContext.isTenantReady();
      const tenantSlug = this.tenantContext.getTenantSlug();

      if (!isReady || !tenantSlug) {
        return;
      }

      if (this.loadedPopupForTenant === tenantSlug) {
        return;
      }

      this.loadedPopupForTenant = tenantSlug;
      this.loadActivePopup();
    });
  }

  readonly tenantBackgroundColor = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return (
      config?.tenant.branding?.backgroundColor ||
      config?.theme?.background ||
      '#f8fafc'
    );
  });

  readonly watermarkBackgroundImage = computed(() => {
    const logo =
      this.tenantContext.getResolvedTenantLogoUrl() ||
      '/assets/images/logoEcommerce.png';
    return `url('${logo}')`;
  });

  closePopup(): void {
    this.showPopup.set(false);
  }

  private loadActivePopup(): void {
    this.publicPopupService.getActivePopup().subscribe({
      next: (popup: StorePopupResponse | null) => {
        if (!popup?.imageUrl || !popup.id) {
          this.activePopup.set(null);
          this.showPopup.set(false);
          return;
        }

        this.activePopup.set({
          id: popup.id,
          imageUrl: popup.imageUrl,
          targetUrl: popup.targetUrl,
          buttonText: popup.buttonText,
        });
        this.showPopup.set(true);
      },
      error: () => {
        this.activePopup.set(null);
        this.showPopup.set(false);
      },
    });
  }
}
