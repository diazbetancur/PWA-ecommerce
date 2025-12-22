import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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

/**
 * Guard que verifica si el usuario tiene acceso al área administrativa
 * Se basa en:
 * 1. Que tenga roles que NO sean solo Customer
 * 2. Que tenga el campo 'modules' en el token (puede estar vacío = acceso total)
 *
 * La visibilidad del menú se controla por el array 'modules':
 * - modules: [] → Todos los módulos visibles
 * - modules: ['products', 'categories'] → Solo esos módulos visibles
 */
export const EmployeeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const claims = auth.claims;
  console.log('[EmployeeGuard] Checking access');
  console.log('[EmployeeGuard] Claims:', claims);
  console.log('[EmployeeGuard] Roles:', claims?.roles);
  console.log('[EmployeeGuard] Modules:', claims?.modules);

  if (!claims?.roles || claims.roles.length === 0) {
    console.log('[EmployeeGuard] ❌ No roles found - denying access');
    router.navigate(['/']);
    return false;
  }

  // Verificar si tiene algún rol que NO sea Customer
  const hasEmployeeRole = claims.roles.some(
    (role) => role.toLowerCase() !== 'customer'
  );

  console.log('[EmployeeGuard] hasEmployeeRole:', hasEmployeeRole);

  if (!hasEmployeeRole) {
    console.log('[EmployeeGuard] ❌ Only Customer role - denying access');
    router.navigate(['/']);
    return false;
  }

  // Verificar que tenga el campo modules (puede estar vacío)
  // La presencia del campo indica que es un usuario con acceso administrativo
  if (!claims.modules) {
    console.log(
      '[EmployeeGuard] ❌ No modules field in token - denying access'
    );
    router.navigate(['/']);
    return false;
  }

  console.log(
    '[EmployeeGuard] ✅ Employee role + modules field found - granting access'
  );
  console.log(
    '[EmployeeGuard] Available modules:',
    claims.modules.length === 0 ? 'ALL (empty array)' : claims.modules
  );
  return true;
};
