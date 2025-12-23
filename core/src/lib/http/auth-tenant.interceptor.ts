import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { TenantConfigService } from '../services/tenant-config.service';

export const authTenantInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tenantConfigService = inject(TenantConfigService);
  const env = inject<AppEnv>(APP_ENV);
  const router = inject(Router);

  let headers = req.headers;

  // Agregar Authorization header si existe token
  if (auth.token) {
    headers = headers.set('Authorization', `Bearer ${auth.token}`);
  }

  // Agregar X-Tenant-Slug header
  if (env.useTenantHeader) {
    // Primero intentar obtener de TenantConfigService
    let tenantSlug = tenantConfigService.tenantSlug;

    // Si no hay tenant en el servicio, intentar leer del query parameter
    if (!tenantSlug) {
      const search = globalThis.location?.search ?? '';
      const qp = new URLSearchParams(search);
      const t = qp.get('tenant');
      if (t && t.trim() !== '') {
        tenantSlug = t;
      }
    }

    // Si finalmente tenemos un tenant, agregarlo al header
    if (tenantSlug) {
      headers = headers.set('X-Tenant-Slug', tenantSlug);
      console.log('[authTenantInterceptor] Adding X-Tenant-Slug:', tenantSlug);
    }
  }

  return next(req.clone({ headers })).pipe(
    catchError((e) => {
      console.error('[authTenantInterceptor] Error:', e?.status, e?.message);

      // 401 = No autenticado (token inválido/expirado) -> Desloguear
      if (e?.status === 401) {
        auth.clear();

        // Obtener tenant del query parameter o del servicio
        let tenantSlug = tenantConfigService.tenantSlug;
        if (!tenantSlug) {
          const search = globalThis.location?.search ?? '';
          const qp = new URLSearchParams(search);
          const t = qp.get('tenant');
          if (t && t.trim() !== '') {
            tenantSlug = t;
          }
        }

        // Si hay tenant, redirigir al login del tenant preservando el query param
        // Si no hay tenant, redirigir al login admin
        if (tenantSlug) {
          router.navigateByUrl(`/login?tenant=${tenantSlug}`);
        } else {
          router.navigateByUrl('/admin/login');
        }
      }

      // 403 = No autorizado (sin permisos) -> NO desloguear, dejar que el componente maneje el error
      // El error se propaga al componente que hizo la petición

      return throwError(() => e);
    })
  );
};
