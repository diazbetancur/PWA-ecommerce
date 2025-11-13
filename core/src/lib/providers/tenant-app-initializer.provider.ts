import { isPlatformBrowser } from '@angular/common';
import { APP_INITIALIZER, inject, PLATFORM_ID, Provider } from '@angular/core';
import { Router } from '@angular/router';
import { TenantBootstrapService } from '../services/tenant-bootstrap.service';

/**
 * 🚀 Factory para APP_INITIALIZER conectado al backend real de Azure
 *
 * Este factory:
 * 1. Inicializa el TenantBootstrapService (llama al backend)
 * 2. Verifica si hay errores de resolución de tenant
 * 3. Redirige a /tenant/not-found si el tenant no existe o hay errores
 * 4. Bloquea la inicialización de la app hasta que el tenant esté cargado
 *
 * Endpoint usado: GET /api/public/tenant/resolve?tenant={slug}
 *
 * @returns Promise<void> que se resuelve cuando el tenant está listo
 */
export function tenantBootstrapFactory(): () => Promise<void> {
  const platformId = inject(PLATFORM_ID);
  const tenantBootstrap = inject(TenantBootstrapService);
  const router = inject(Router);

  return async (): Promise<void> => {
    // En SSR, simplemente inicializar con configuración por defecto
    if (!isPlatformBrowser(platformId)) {
      console.log('🖥️ [APP_INITIALIZER] SSR detectado - saltando bootstrap de tenant');
      await tenantBootstrap.initialize();
      return;
    }

    try {
      console.log('🚀 [APP_INITIALIZER] Iniciando bootstrap del tenant...');

      // Inicializar el tenant (llama al backend de Azure)
      await tenantBootstrap.initialize();

      // Verificar si hubo errores
      if (tenantBootstrap.hasErrorState()) {
        const error = tenantBootstrap.error();
        const status = tenantBootstrap.status();

        console.warn('⚠️ [APP_INITIALIZER] Error al cargar tenant:', {
          status,
          error: error?.message,
          code: error?.code,
          slug: tenantBootstrap.attemptedSlug()
        });

        // Si el tenant no fue encontrado y está configurado para redirigir
        if (tenantBootstrap.needsRedirect()) {
          console.log('🔀 [APP_INITIALIZER] Redirigiendo a página de error de tenant...');

          // Redirigir a la página de error
          // Usamos setTimeout para asegurar que el router esté listo
          setTimeout(() => {
            router.navigate(['/tenant/not-found'], {
              queryParams: {
                slug: tenantBootstrap.attemptedSlug(),
                code: error?.code,
                retryable: error?.retryable ? 'true' : 'false'
              },
              replaceUrl: true
            }).catch(navError => {
              console.error('❌ [APP_INITIALIZER] Error navegando a /tenant/not-found:', navError);
            });
          }, 100);
        }

        // La app continuará con configuración por defecto
      } else {
        const tenant = tenantBootstrap.getTenantConfig();
        console.log('✅ [APP_INITIALIZER] Tenant inicializado correctamente:', {
          slug: tenant?.tenant.slug,
          displayName: tenant?.tenant.displayName,
          strategy: tenantBootstrap.resolvedStrategy()?.type
        });
      }

    } catch (error) {
      console.error('❌ [APP_INITIALIZER] Error crítico en bootstrap del tenant:', error);

      // No lanzar el error para no bloquear completamente la app
      // La app se iniciará con configuración por defecto
      // pero intentamos redirigir al error page
      setTimeout(() => {
        router.navigate(['/tenant/not-found'], {
          queryParams: {
            code: 'UNKNOWN',
            message: 'Error crítico al inicializar el tenant'
          },
          replaceUrl: true
        }).catch(navError => {
          console.error('❌ [APP_INITIALIZER] Error navegando después de error crítico:', navError);
        });
      }, 100);
    }
  };
}

/**
 * 📦 Provider completo para usar en app.config.ts
 *
 * Uso en app.config.ts:
 * ```typescript
 * import { TENANT_APP_INITIALIZER } from '@pwa/core';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(appRoutes),
 *     provideHttpClient(withFetch()),
 *     TENANT_APP_INITIALIZER,  // 👈 Agregar aquí
 *     // ... otros providers
 *   ]
 * };
 * ```
 *
 * IMPORTANTE:
 * - Debe ir DESPUÉS de provideRouter y provideHttpClient
 * - Se ejecuta ANTES de que la aplicación se inicialice
 * - Bloquea el arranque hasta que el tenant esté resuelto
 */
export const TENANT_APP_INITIALIZER: Provider = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: tenantBootstrapFactory,
  deps: []
};
