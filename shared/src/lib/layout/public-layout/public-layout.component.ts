import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';
import {
  FooterComponent,
  HeaderComponent,
  WhatsappButtonComponent,
} from '../../ui';
import { ToastContainerComponent } from '../../ui/toast-container/toast-container.component';

@Component({
  selector: 'lib-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    WhatsappButtonComponent,
    ToastContainerComponent,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly tenantContext = inject(TenantContextService);

  readonly tenantBackgroundColor = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return (
      config?.tenant.branding?.backgroundColor ||
      config?.theme?.background ||
      '#f8fafc'
    );
  });

  readonly watermarkBackgroundImage = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    const tenantLogo =
      config?.tenant.branding?.logoUrl || config?.theme?.logoUrl;
    const logo = this.resolveLogoUrl(tenantLogo, config?.cdnBaseUrl);
    return `url('${logo}')`;
  });

  private resolveLogoUrl(logoUrl?: string, cdnBaseUrl?: string): string {
    if (!logoUrl) {
      return '/assets/images/logoEcommerce.png';
    }

    if (
      logoUrl.startsWith('http://') ||
      logoUrl.startsWith('https://') ||
      logoUrl.startsWith('data:') ||
      logoUrl.startsWith('blob:')
    ) {
      return logoUrl;
    }

    if (logoUrl.startsWith('/')) {
      return logoUrl;
    }

    if (cdnBaseUrl) {
      const normalizedBase = cdnBaseUrl.endsWith('/')
        ? cdnBaseUrl
        : `${cdnBaseUrl}/`;
      return `${normalizedBase}${logoUrl}`;
    }

    return `/${logoUrl}`;
  }
}
