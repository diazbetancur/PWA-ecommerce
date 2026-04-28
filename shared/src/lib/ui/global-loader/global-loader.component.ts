import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { GlobalLoaderService, TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loader.component.html',
  styleUrl: './global-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppGlobalLoaderComponent {
  private readonly loader = inject(GlobalLoaderService);
  private readonly tenantContext = inject(TenantContextService);

  private readonly logoFailed = signal(false);

  readonly isVisible = this.loader.isVisible;
  readonly tenantLogoUrl = computed(() => {
    const brandingLogo = this.tenantContext.pwaBranding()?.logoUrl?.trim();
    if (brandingLogo) {
      return brandingLogo;
    }

    const currentTenant = this.tenantContext.getCurrentTenant() as {
      branding?: { logoUrl?: string | null };
    } | null;

    return currentTenant?.branding?.logoUrl?.trim() || null;
  });

  readonly showLogo = computed(
    () => !!this.tenantLogoUrl() && !this.logoFailed()
  );

  readonly logoAltText = computed(() => {
    const brandingName = this.tenantContext.pwaBranding()?.name?.trim();
    const tenantName = this.tenantContext
      .getCurrentTenant()
      ?.displayName?.trim();
    const name = brandingName || tenantName || 'tu comercio';

    return `Logo de ${name}`;
  });

  constructor() {
    effect(() => {
      this.tenantLogoUrl();
      this.logoFailed.set(false);
    });
  }

  handleLogoError(): void {
    this.logoFailed.set(true);
  }
}
