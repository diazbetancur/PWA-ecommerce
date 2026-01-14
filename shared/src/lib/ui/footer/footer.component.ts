import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly tenantContext = inject(TenantContextService);

  currentYear = new Date().getFullYear();

  displayName = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.displayName || 'Tienda';
  });

  description = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.seo?.description || '';
  });

  contact = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.contact;
  });

  social = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.social;
  });
}
