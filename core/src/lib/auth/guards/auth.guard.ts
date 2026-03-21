import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantResolutionService } from '../../services/tenant-resolution.service';
import { AuthService } from '../auth.service';

export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const tenantResolution = inject(TenantResolutionService);
  if (auth.isAuthenticated()) return true;

  const tenantSlug = tenantResolution.getTenantSlug();
  if (tenantSlug && !tenantResolution.isAdminContext()) {
    router.navigateByUrl(`/account/login?tenant=${tenantSlug}`);
  } else {
    router.navigateByUrl('/admin/login');
  }
  return false;
};
