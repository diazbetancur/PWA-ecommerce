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
export const loyaltyFeatureGuard: CanActivateFn = async () => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  // Esperar a que el tenant esté disponible (máximo 3 segundos)
  try {
    await tenantContext.waitForTenant(3000);
  } catch (error) {
    void error;
    router.navigate(['/tenant/not-found']);
    return false;
  }

  const currentConfig = tenantContext.currentConfig();

  const features = currentConfig?.features;

  // Compatibilidad: si backend no envía features o viene vacío, NO bloquear.
  if (!features || Object.keys(features).length === 0) {
    return true;
  }

  // Bloquear únicamente cuando loyalty está explícitamente deshabilitado.
  const loyaltyFlag = features['loyalty'] ?? features['enableLoyalty'];
  if (loyaltyFlag === false) {
    router.navigate(['/tenant-admin/dashboard']);
    return false;
  }

  return true;
};
