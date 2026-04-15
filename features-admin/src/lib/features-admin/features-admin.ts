import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { PushService, TenantConfigService } from '@pwa/core';
import { buildAppSnackBarConfig } from '@pwa/shared';

@Component({
  selector: 'lib-features-admin',
  imports: [MatButtonModule, MatSnackBarModule],
  templateUrl: './features-admin.html',
  styleUrl: './features-admin.css',
})
export class FeaturesAdmin {
  private readonly push = inject(PushService);
  private readonly tenant = inject(TenantConfigService);
  private readonly matSnack = inject(MatSnackBar);
  private readonly snack = {
    open: (message: string, action?: string, config?: MatSnackBarConfig) =>
      this.matSnack.open(
        message,
        action,
        buildAppSnackBarConfig(message, config)
      ),
  };

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
