import { isPlatformBrowser } from '@angular/common';
import { APP_INITIALIZER, inject, PLATFORM_ID, Provider } from '@angular/core';
import { Router } from '@angular/router';
import { TenantBootstrapService } from '../services/tenant-bootstrap.service';

export function tenantAppInitializerFactory(): () => Promise<void> {
  const platformId = inject(PLATFORM_ID);
  const tenantBootstrap = inject(TenantBootstrapService);
  const router = inject(Router);

  return async (): Promise<void> => {
    if (!isPlatformBrowser(platformId)) {
      await tenantBootstrap.initialize();
      return;
    }

    try {
      await tenantBootstrap.initialize();

      const attemptedSlug = tenantBootstrap.attemptedSlug();
      const isGeneralAdminMode = !attemptedSlug || attemptedSlug.trim() === '';

      if (isGeneralAdminMode) {
        setTimeout(() => {
          router.navigate(['/admin'], { replaceUrl: true }).catch(() => {});
        }, 100);
        return;
      }

      if (tenantBootstrap.hasErrorState()) {
        const error = tenantBootstrap.error();

        if (tenantBootstrap.needsRedirect()) {
          setTimeout(() => {
            router
              .navigate(['/tenant/not-found'], {
                queryParams: {
                  slug: attemptedSlug,
                  code: error?.code,
                  retryable: error?.retryable ? 'true' : 'false',
                },
                replaceUrl: true,
              })
              .catch(() => {});
          }, 100);
        }
      }
    } catch {
      setTimeout(() => {
        router
          .navigate(['/tenant/not-found'], {
            queryParams: {
              code: 'UNKNOWN',
              message: 'Error crítico al inicializar el tenant',
            },
            replaceUrl: true,
          })
          .catch(() => {});
      }, 100);
    }
  };
}

export const TENANT_APP_INITIALIZER: Provider = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: tenantAppInitializerFactory,
  deps: [],
};
