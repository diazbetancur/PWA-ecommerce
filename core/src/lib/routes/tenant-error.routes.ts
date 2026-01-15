import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { TenantDebugComponent } from '../components/tenant-debug/tenant-debug.component';
import { TenantNotFoundComponent } from '../components/tenant-not-found/tenant-not-found.component';
import { TenantConfigService } from '../services/tenant-config.service';

/**
 * Rutas para manejo de errores y debug de tenant
 */
export const TENANT_ERROR_ROUTES: Routes = [
  {
    path: 'tenant/not-found',
    component: TenantNotFoundComponent,
    title: 'Comercio No Encontrado',
    data: {
      description: 'El comercio solicitado no pudo ser cargado',
      noLayout: true, // Indica que no debe usar el layout principal
    },
  },
  {
    path: 'tenant/debug',
    component: TenantDebugComponent,
    title: 'Tenant Debug Panel',
    data: {
      description: 'Panel de debug para inspeccionar información del tenant',
      noLayout: true, // No usar layout principal para tener control completo
    },
  },
  {
    path: 'tenant/error',
    redirectTo: 'tenant/not-found',
  },
];

/**
 * Guard para verificar el estado del tenant
 * Redirige a /admin si NO hay tenant cargado
 * Este guard protege rutas que REQUIEREN tenant activo (catalog, cart, etc.)
 */
export const tenantGuard: CanActivateFn = () => {
  const tenantConfig = inject(TenantConfigService);
  const router = inject(Router);

  // Verificar si hay tenant cargado
  if (!tenantConfig.config || !tenantConfig.tenantSlug) {
    // Redirigir al login administrativo cuando no hay tenant
    return router.createUrlTree(['/admin']);
  }

  return true;
};
