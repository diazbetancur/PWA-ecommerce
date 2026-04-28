import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { HTTP_ERROR_NOTIFIER } from '../errors/app-error';
import {
  attachRequestCorrelationId,
  mapErrorToAppError,
} from '../errors/http-error.mapper';
import { GlobalLoaderService } from '../services/global-loader.service';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantResolutionService } from '../services/tenant-resolution.service';
import {
  SHOW_HTTP_ERROR_TOAST,
  SILENT_HTTP_CONTEXT,
} from './http-context.tokens';

function createCorrelationId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export const authTenantInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tenantContext = inject(TenantContextService);
  const tenantResolution = inject(TenantResolutionService);
  const loader = inject(GlobalLoaderService);
  const env = inject<AppEnv>(APP_ENV);
  const router = inject(Router);
  const notifyHttpError = inject(HTTP_ERROR_NOTIFIER, { optional: true });

  if (!tenantContext.shouldHandleHttpRequest(req.url)) {
    return next(req);
  }

  const isSilentRequest = req.context.get(SILENT_HTTP_CONTEXT);
  const showErrorToast = req.context.get(SHOW_HTTP_ERROR_TOAST);
  const correlationId = createCorrelationId();

  let headers = req.headers;

  const resolvedTenantSlug =
    tenantContext.getTenantSlug() || tenantResolution.getTenantSlug() || null;

  headers = headers.set('X-Correlation-Id', correlationId);

  // Agregar Authorization header si existe token
  if (auth.token) {
    headers = headers.set('Authorization', `Bearer ${auth.token}`);
  }

  // Agregar X-Tenant-Slug solo a requests backend con contexto tenant real.
  if (
    env.useTenantHeader &&
    resolvedTenantSlug &&
    tenantContext.shouldIncludeTenantHeaders(req.url)
  ) {
    headers = headers.set('X-Tenant-Slug', resolvedTenantSlug);
  }

  if (!isSilentRequest) {
    loader.beginRequest();
  }

  return next(req.clone({ headers })).pipe(
    catchError((e) => {
      attachRequestCorrelationId(e, correlationId);
      const appError = mapErrorToAppError(e);

      // 401 = No autenticado (token inválido/expirado) -> Desloguear
      if (e?.status === 401) {
        auth.clear();

        // Obtener tenant desde el resolver central (sin leer query params)
        const tenantSlug =
          resolvedTenantSlug || tenantResolution.getTenantSlug();
        const isAdminContext = tenantResolution.isAdminContext();

        if (tenantSlug && !isAdminContext) {
          router.navigateByUrl('/account/login');
        } else {
          router.navigateByUrl('/admin/login');
        }
      } else if (showErrorToast && notifyHttpError) {
        notifyHttpError(appError);
      }

      // 403 = No autorizado (sin permisos) -> NO desloguear, dejar que el componente maneje el error
      // El error se propaga al componente que hizo la petición

      return throwError(() => e);
    }),
    finalize(() => {
      if (!isSilentRequest) {
        loader.endRequest();
      }
    })
  );
};
