import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@pwa/core';

/**
 * 🎁 Guard para verificar que el tenant tenga habilitado el módulo de Loyalty
 *
 * Protege las rutas de loyalty para que solo sean accesibles si:
 * - El tenant tiene `features.loyalty === true` en su configuración
 *
 * Si el tenant no tiene el feature habilitado:
 * - Redirige al dashboard de admin
 * - Muestra advertencia en consola
 *
 * Uso:
 * ```ts
 * {
 *   path: 'loyalty',
 *   canActivate: [loyaltyFeatureGuard],
 *   loadChildren: () => import('./pages/loyalty').then(m => m.loyaltyRoutes)
 * }
 * ```
 */
export const loyaltyFeatureGuard: CanActivateFn = () => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  const currentConfig = tenantContext.currentConfig();
  const hasLoyalty = currentConfig?.features?.['loyalty'] ?? false;

  if (!hasLoyalty) {
    console.warn(
      `[LoyaltyFeatureGuard] Loyalty feature not enabled for tenant: ${
        currentConfig?.tenant.slug || 'unknown'
      }`
    );
    router.navigate(['/tenant-admin/dashboard']);
    return false;
  }

  return true;
};
