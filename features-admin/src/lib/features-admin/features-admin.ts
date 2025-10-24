import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PushService, TenantConfigService } from '@pwa/core';

@Component({
  selector: 'lib-features-admin',
  imports: [MatButtonModule, MatSnackBarModule],
  templateUrl: './features-admin.html',
  styleUrl: './features-admin.css',
})
export class FeaturesAdmin {
  private readonly push = inject(PushService);
  private readonly tenant = inject(TenantConfigService);
  private readonly snack = inject(MatSnackBar);

  readonly pushEnabled = computed(
    () => !!this.tenant.config?.features?.['push']
  );

  async sendTestPush() {
    await this.push.init();
    const slug = this.tenant.tenantSlug ?? 'default';
    const token = globalThis.localStorage?.getItem(`push_${slug}`) ?? '';
    const suffix = token.slice(-8) || 'NO-TOKEN';
    this.snack.open(`Token: ...${suffix}`, undefined, { duration: 3000 });
  }
}
