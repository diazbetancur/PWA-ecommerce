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
export const multiStoreFeatureGuard: CanActivateFn = async () => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  // Esperar a que el tenant esté disponible (máximo 3 segundos)
  try {
    await tenantContext.waitForTenant(3000);
  } catch (error) {
    console.error('[MultiStoreFeatureGuard] Timeout esperando tenant:', error);
    router.navigate(['/tenant/not-found']);
    return false;
  }

  const currentConfig = tenantContext.currentConfig();

  // DEBUG: Mostrar todas las features disponibles
  console.log(
    '[MultiStoreFeatureGuard] DEBUG - Current Config:',
    currentConfig
  );
  console.log(
    '[MultiStoreFeatureGuard] DEBUG - Features:',
    currentConfig?.features
  );
  console.log(
    '[MultiStoreFeatureGuard] DEBUG - features.multiStore:',
    currentConfig?.features?.['multiStore']
  );
  console.log(
    '[MultiStoreFeatureGuard] DEBUG - features.enableMultiStore:',
    currentConfig?.features?.['enableMultiStore']
  );

  // Buscar multiStore con diferentes nombres posibles
  const hasMultiStore =
    currentConfig?.features?.['multiStore'] ??
    currentConfig?.features?.['enableMultiStore'] ??
    false;

  if (!hasMultiStore) {
    console.warn(
      `[MultiStoreFeatureGuard] Multi-store feature not enabled for tenant: ${
        currentConfig?.tenant.slug || 'unknown'
      }. Available features:`,
      Object.keys(currentConfig?.features || {})
    );
    router.navigate(['/tenant-admin/dashboard']);
    return false;
  }

  console.log(
    '[MultiStoreFeatureGuard] ✅ Multi-store feature enabled, allowing access'
  );
  return true;
};
