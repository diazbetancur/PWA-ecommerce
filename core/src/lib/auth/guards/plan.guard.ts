import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TenantConfigService } from '../../services/tenant-config.service';

export const PlanGuard =
  (flag: string): CanActivateFn =>
  () => {
    const cfg = inject(TenantConfigService).config;
    return !!cfg?.features?.[flag];
  };
