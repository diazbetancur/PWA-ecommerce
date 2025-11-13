import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TenantBootstrapService } from '../services/tenant-bootstrap.service';

/**
 * Inicializador de aplicación mejorado con manejo de errores de tenant
 * Redirige automáticamente a /tenant/not-found si hay errores
 */
export function createTenantAppInitializer() {
  return async (): Promise<void> => {
    const platformId = inject(PLATFORM_ID);
    const tenantBootstrap = inject(TenantBootstrapService);
    const router = inject(Router);

    // Solo ejecutar en el browser
    if (!isPlatformBrowser(platformId)) {
      return;
    }

    try {
      console.log('🚀 Initializing tenant bootstrap...');
      await tenantBootstrap.initialize();

      // Verificar si hubo errores después de la inicialización
      if (tenantBootstrap.hasError()) {
        const error = tenantBootstrap.getCurrentError();
        console.error('❌ Tenant initialization failed:', error);

        // Redirigir a la página de error de tenant
        await router.navigate(['/tenant/not-found'], {
          skipLocationChange: false,
          replaceUrl: true
        });
        return;
      }

      console.log('✅ Tenant initialized successfully');
    } catch (error) {
      console.error('💥 Critical error during tenant initialization:', error);

      // En caso de error crítico, también redirigir
      try {
        await router.navigate(['/tenant/not-found'], {
          skipLocationChange: false,
          replaceUrl: true
        });
      } catch (navError) {
        console.error('🚨 Failed to navigate to error page:', navError);
        // Como último recurso, mostrar alerta y recargar
        alert('Error crítico cargando la aplicación. La página se recargará.');
        globalThis.location.reload();
      }
    }
  };
}

/**
 * Provider para el APP_INITIALIZER con manejo de errores
 */
export const TENANT_APP_INITIALIZER = {
  provide: 'APP_INITIALIZER',
  useFactory: createTenantAppInitializer,
  multi: true,
  deps: []
};
