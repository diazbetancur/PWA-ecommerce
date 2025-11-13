import { Routes } from '@angular/router';
import { TenantNotFoundComponent, TenantDebugComponent, ApiTestDemoComponent, CurrencyDemoComponent } from '@pwa/core';

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
      noLayout: true // Indica que no debe usar el layout principal
    }
  },
  {
    path: 'tenant/debug',
    component: TenantDebugComponent,
    title: 'Tenant Debug Panel',
    data: {
      description: 'Panel de debug para inspeccionar información del tenant',
      noLayout: true // No usar layout principal para tener control completo
    }
  },
  {
    path: 'tenant/api-test',
    component: ApiTestDemoComponent,
    title: 'API Client Test',
    data: {
      description: 'Demo del ApiClientService con headers multi-tenant',
      noLayout: false // Usar layout normal
    }
  },
  {
    path: 'tenant/currency-demo',
    component: CurrencyDemoComponent,
    title: 'Currency Multi-tenant Demo',
    data: {
      description: 'Demostración de formateo de monedas multi-tenant',
      noLayout: false
    }
  },
  {
    path: 'tenant/error',
    redirectTo: 'tenant/not-found'
  }
];

/**
 * Guard para verificar el estado del tenant
 * Redirige a /tenant/not-found si hay errores
 */
export const tenantGuard = () => {
  // Este guard se puede usar en rutas que requieren tenant válido
  // Por ahora solo importamos y exportamos las rutas
  return true;
};
