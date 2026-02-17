import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  AuthService,
  TenantBootstrapService,
  TenantContextService,
} from '@pwa/core';

/**
 * 🏪 Guard para verificar que el tenant tenga habilitado multi-store
 *
 * Protege las rutas de gestión de tiendas/sucursales para que solo sean accesibles si:
 * - El usuario tiene el feature `enableMultiStore === true` en sus claims
 *
 * Si el usuario no tiene el feature habilitado:
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
  const authService = inject(AuthService);
  const tenantContext = inject(TenantContextService);
  const tenantBootstrap = inject(TenantBootstrapService);
  const router = inject(Router);

  // Si el tenant no está cargado, forzar inicialización
  if (!tenantContext.isTenantReady()) {
    try {
      await tenantBootstrap.initialize();
    } catch (error) {
      void error;
    }
  }

  // Esperar a que el tenant esté disponible (máximo 3 segundos)
  try {
    await tenantContext.waitForTenant(3000);
  } catch {
    router.navigate(['/tenant/not-found']);
    return false;
  }

  // Obtener features del usuario desde authService.claims
  const claims = authService.claims;
  const userFeatures = claims?.features || {};

  // Buscar enableMultiStore en las features del usuario
  const hasMultiStore = userFeatures['enableMultiStore'] === true;

  if (!hasMultiStore) {
    router.navigate(['/tenant-admin/dashboard']);
    return false;
  }
  return true;
};
