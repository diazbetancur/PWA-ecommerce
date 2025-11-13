import { APP_INITIALIZER, Provider, inject } from '@angular/core';
import { TenantBootstrapService } from '@pwa/core';

/**
 * Factory function para el APP_INITIALIZER
 * Esta función se ejecuta antes de que la aplicación se inicie completamente
 */
export function tenantBootstrapFactory(): () => Promise<void> {
  const tenantBootstrapService = inject(TenantBootstrapService);

  return async (): Promise<void> => {
    try {
      await tenantBootstrapService.initialize();
      console.log('✅ Tenant bootstrap completado exitosamente');
    } catch (error) {
      console.error('❌ Error en tenant bootstrap:', error);
      // No lanzar el error para evitar que la app falle completamente
      // El servicio ya maneja el fallback a configuración por defecto
    }
  };
}

/**
 * Provider para el bootstrap del tenant
 * Usar este provider en el applicationConfig
 */
export const provideTenantBootstrap = (): Provider => ({
  provide: APP_INITIALIZER,
  useFactory: tenantBootstrapFactory,
  multi: true
});

/**
 * Provider alternativo usando función standalone
 * Para ser usado directamente en bootstrapApplication
 */
export function bootstrapTenant(): Promise<void> {
  const tenantBootstrapService = inject(TenantBootstrapService);
  return tenantBootstrapService.initialize();
}
