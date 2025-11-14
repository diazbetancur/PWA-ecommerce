import { Routes, Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TenantNotFoundComponent } from '../components/tenant-not-found/tenant-not-found.component';
import { TenantDebugComponent } from '../components/tenant-debug/tenant-debug.component';
import { ApiTestDemoComponent } from '../components/api-test-demo/api-test-demo.component';
import { CurrencyDemoComponent } from '../components/currency-demo/currency-demo.component';
import { TenantConfigService } from '../services/tenant-config.service';

/**
 * Rutas para manejo de errores y debug de tenant
 */
export const TENANT_ERROR_ROUTES: Routes = [
  {
    path: 'tenant/not-found',
    component: TenantNotFoundComponent,
    title: 'Tenant No Encontrado',
    data: {
      description: 'El tenant solicitado no pudo ser cargado',
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
    path: 'tenant/api-test',
    component: ApiTestDemoComponent,
    title: 'API Client Test',
    data: {
      description: 'Demo del ApiClientService con headers multi-tenant',
      noLayout: false, // Usar layout normal
    },
  },
  {
    path: 'tenant/currency-demo',
    component: CurrencyDemoComponent,
    title: 'Currency Multi-tenant Demo',
    data: {
      description: 'Demostración de formateo de monedas multi-tenant',
      noLayout: false,
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
    console.log('🚫 [tenantGuard] No hay tenant - redirigiendo a /admin');
    // Redirigir al login administrativo cuando no hay tenant
    return router.createUrlTree(['/admin']);
  }

  console.log('✅ [tenantGuard] Tenant activo:', tenantConfig.tenantSlug);
  return true;
};
