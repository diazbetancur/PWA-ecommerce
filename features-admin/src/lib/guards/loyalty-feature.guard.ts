import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantBootstrapService, TenantContextService } from '@pwa/core';

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
export const loyaltyFeatureGuard: CanActivateFn = async () => {
  const tenantContext = inject(TenantContextService);
  const tenantBootstrap = inject(TenantBootstrapService);
  const router = inject(Router);

  // Si el tenant no está cargado, forzar inicialización
  if (!tenantContext.isTenantReady()) {
    console.log(
      '[LoyaltyFeatureGuard] Tenant not ready, forcing initialization...'
    );
    try {
      await tenantBootstrap.initialize();
    } catch (error) {
      console.error(
        '[LoyaltyFeatureGuard] Failed to initialize tenant:',
        error
      );
    }
  }

  // Esperar a que el tenant esté disponible (máximo 3 segundos)
  try {
    await tenantContext.waitForTenant(3000);
  } catch (error) {
    console.error('[LoyaltyFeatureGuard] Timeout esperando tenant:', error);
    router.navigate(['/tenant/not-found']);
    return false;
  }

  const currentConfig = tenantContext.currentConfig();

  // DEBUG: Mostrar todas las features disponibles
  console.log('[LoyaltyFeatureGuard] DEBUG - Current Config:', currentConfig);
  console.log(
    '[LoyaltyFeatureGuard] DEBUG - Features:',
    currentConfig?.features
  );
  console.log(
    '[LoyaltyFeatureGuard] DEBUG - features.loyalty:',
    currentConfig?.features?.['loyalty']
  );
  console.log(
    '[LoyaltyFeatureGuard] DEBUG - features.enableLoyalty:',
    currentConfig?.features?.['enableLoyalty']
  );

  // Buscar loyalty con diferentes nombres posibles
  const hasLoyalty =
    currentConfig?.features?.['loyalty'] ??
    currentConfig?.features?.['enableLoyalty'] ??
    false;

  if (!hasLoyalty) {
    console.warn(
      `[LoyaltyFeatureGuard] Loyalty feature not enabled for tenant: ${
        currentConfig?.tenant.slug || 'unknown'
      }. Available features:`,
      Object.keys(currentConfig?.features || {})
    );
    router.navigate(['/tenant-admin/dashboard']);
    return false;
  }

  console.log(
    '[LoyaltyFeatureGuard] ✅ Loyalty feature enabled, allowing access'
  );
  return true;
};
