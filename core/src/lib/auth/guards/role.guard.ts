import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';

export const RoleGuard =
  (requiredRole: string): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return auth.hasRole(requiredRole);
  };

export const PermissionGuard =
  (permission: string): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return auth.hasPermission(permission);
  };
