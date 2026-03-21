import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { APP_ENV, AppEnv } from '../config/app-env.token';
import { TenantConfigService } from '../services/tenant-config.service';
import { TenantResolutionService } from '../services/tenant-resolution.service';

export const authTenantInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tenantConfig = inject(TenantConfigService);
  const tenantResolution = inject(TenantResolutionService);
  const env = inject<AppEnv>(APP_ENV);
  const router = inject(Router);

  let headers = req.headers;
  let url = req.url;

  const resolvedTenantSlug =
    tenantResolution.getTenantSlug() ||
    tenantConfig.tenantSlug ||
    auth.claims?.tenant_slug ||
    null;

  // Agregar Authorization header si existe token
  if (auth.token) {
    headers = headers.set('Authorization', `Bearer ${auth.token}`);
  }

  // Agregar X-Tenant-Slug header
  if (env.useTenantHeader && resolvedTenantSlug && !isAdminApi(req.url)) {
    headers = headers.set('X-Tenant-Slug', resolvedTenantSlug);
  }

  // Fallback compatible con backend actual:
  // si el endpoint requiere tenant, enviar tambien ?tenant=... cuando no existe.
  if (
    resolvedTenantSlug &&
    requiresTenantContext(req.url) &&
    !hasTenantQueryParam(req.url)
  ) {
    url = appendTenantQueryParam(req.url, resolvedTenantSlug);
  }

  return next(req.clone({ headers, url })).pipe(
    catchError((e) => {
      // 401 = No autenticado (token inválido/expirado) -> Desloguear
      if (e?.status === 401) {
        auth.clear();

        // Obtener tenant desde el resolver central (sin leer query params)
        const tenantSlug =
          resolvedTenantSlug || tenantResolution.getTenantSlug();
        const isAdminContext = tenantResolution.isAdminContext();

        // Si hay tenant, redirigir al login tenant-aware preservando compatibilidad temporal
        // Si no hay tenant, redirigir al login admin
        if (tenantSlug && !isAdminContext) {
          router.navigateByUrl(`/account/login?tenant=${tenantSlug}`);
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

function requiresTenantContext(url: string): boolean {
  if (!url.includes('/api/')) {
    return false;
  }

  if (url.includes('/api/public/') || url.includes('/api/health')) {
    return false;
  }

  if (url.includes('/api/admin/')) {
    return false;
  }

  return true;
}

function isAdminApi(url: string): boolean {
  return url.includes('/api/admin/');
}

function hasTenantQueryParam(url: string): boolean {
  try {
    const parsed = new URL(url, globalThis.location?.origin || 'http://local');
    return (
      parsed.searchParams.has('tenant') || parsed.searchParams.has('store')
    );
  } catch {
    return /[?&](tenant|store)=/.test(url);
  }
}

function appendTenantQueryParam(url: string, tenantSlug: string): string {
  try {
    const parsed = new URL(url, globalThis.location?.origin || 'http://local');
    parsed.searchParams.set('tenant', tenantSlug);

    // Preservar formato relativo cuando la URL original no es absoluta.
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tenant=${encodeURIComponent(tenantSlug)}`;
  }
}
