import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Interceptor que automáticamente añade headers de tenant a todas las requests HTTP
 * que requieran contexto de tenant (excluyendo endpoints públicos)
 */
@Injectable()
export class TenantHeaderInterceptor implements HttpInterceptor {
  private readonly tenantContext = inject(TenantContextService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verificar si esta URL necesita headers de tenant
    if (!this.tenantContext.shouldIncludeTenantHeaders(req.url)) {
      return next.handle(req);
    }

    // Obtener información del tenant
    const tenantHeaders = this.tenantContext.getTenantHeaders();

    // Si no hay tenant cargado aún, continuar sin headers (caso borde inicial)
    if (!tenantHeaders.slug && !tenantHeaders.key) {
      console.warn(`[TenantHeaderInterceptor] No hay tenant cargado para ${req.url}`);
      return next.handle(req);
    }

    // Preparar headers a agregar
    const headersToAdd: { [key: string]: string } = {};

    if (tenantHeaders.slug) {
      headersToAdd['X-Tenant-Slug'] = tenantHeaders.slug;
    }

    if (tenantHeaders.key) {
      headersToAdd['X-Tenant-Key'] = tenantHeaders.key;
    }

    // Crear nueva request con headers adicionales
    const tenantRequest = req.clone({
      setHeaders: headersToAdd
    });

    // Log para debugging (solo en desarrollo)
    if (this.isDevelopment()) {
      console.debug(`[TenantHeaderInterceptor] ${req.method} ${req.url}`, {
        slug: tenantHeaders.slug,
        key: tenantHeaders.key,
        headers: headersToAdd
      });
    }

    return next.handle(tenantRequest);
  }

  /**
   * Verifica si estamos en modo desarrollo
   */
  private isDevelopment(): boolean {
    return !globalThis?.['ng']?.['ɵglobal']?.['production'] &&
           typeof console !== 'undefined';
  }
}
