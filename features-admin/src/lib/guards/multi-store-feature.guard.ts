import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@pwa/core';

/**
 * 🏪 Guard para verificar que el tenant tenga habilitado multi-store
 *
 * Protege las rutas de gestión de tiendas/sucursales para que solo sean accesibles si:
 * - El tenant tiene `features.multiStore === true` en su configuración
 *
 * Si el tenant no tiene el feature habilitado:
 * - Redirige al dashboard de admin
 * - Muestra advertencia en consola
 *
 * Uso:
 * ```ts
 * {
 *   path: 'stores',
 *   canActivate: [multiStoreFeatureGuard],
 *   loadChildren: () => import('./pages/stores').then(m => m.storesRoutes)
 * }
 * ```
 */
export const multiStoreFeatureGuard: CanActivateFn = () => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  const currentConfig = tenantContext.currentConfig();
  const hasMultiStore = currentConfig?.features?.multiStore ?? false;

  if (!hasMultiStore) {
    console.warn(
      `[MultiStoreFeatureGuard] Multi-store feature not enabled for tenant: ${
        currentConfig?.tenant.slug || 'unknown'
      }`
    );
    router.navigate(['/tenant-admin/dashboard']);
    return false;
  }

  return true;
};
