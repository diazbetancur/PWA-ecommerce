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
        router.navigateByUrl('/login');
      }
      return throwError(() => e);
    })
  );
};
