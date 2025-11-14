import { Component, DOCUMENT, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly tenantContext = inject(TenantContextService);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);

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
