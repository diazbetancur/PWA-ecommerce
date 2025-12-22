import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { TenantConfigService } from '../services/tenant-config.service';

export const authTenantInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tenant = inject(TenantConfigService).tenantSlug;
  const env = inject<AppEnv>(APP_ENV);
  const router = inject(Router);

  let headers = req.headers;
  if (auth.token)
    headers = headers.set('Authorization', `Bearer ${auth.token}`);
  if (env.useTenantHeader && tenant)
    headers = headers.set('X-Tenant-Slug', tenant);

  return next(req.clone({ headers })).pipe(
    catchError((e) => {
      if (e?.status === 401 || e?.status === 403) {
        auth.clear();

        // Determinar la ruta de login según el contexto
        const claims = auth.claims;
        const hasTenantInToken = !!claims?.tenant_slug;

        // Si el usuario tenía tenant, redirigir a login del tenant
        // Si no, redirigir a login general
        const loginRoute = hasTenantInToken ? '/login' : '/admin/login';
        router.navigateByUrl(loginRoute);
      }
      return throwError(() => e);
    })
  );
};
