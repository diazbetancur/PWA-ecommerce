import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TenantContextService } from '../services/tenant-context.service';
import { AppEnvService } from '../services/app-env.service';

/**
 * Interceptor que automáticamente añade headers de tenant a todas las requests HTTP
 * que requieran contexto de tenant (excluyendo endpoints públicos)
 *
 * En modo desarrollo, genera logs detallados de cada request:
 * - URL completa
 * - Método HTTP
 * - Headers de tenant agregados
 * - Tiempo de respuesta
 * - Status code de respuesta
 */
@Injectable()
export class TenantHeaderInterceptor implements HttpInterceptor {
  private readonly tenantContext = inject(TenantContextService);
  private readonly envService = inject(AppEnvService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();

    // Verificar si esta URL necesita headers de tenant
    const needsTenantHeaders = this.tenantContext.shouldIncludeTenantHeaders(req.url);

    if (!needsTenantHeaders) {
      // Log de requests públicos (sin headers de tenant)
      if (this.isDevelopment()) {
        this.logPublicRequest(req);
      }
      return next.handle(req);
    }

    // Obtener información del tenant
    const tenantHeaders = this.tenantContext.getTenantHeaders();

    // Si no hay tenant cargado aún, continuar sin headers (caso borde inicial)
    if (!tenantHeaders.slug && !tenantHeaders.key) {
      console.warn(
        `⚠️  [TenantHeaderInterceptor] No hay tenant cargado\n` +
        `    URL: ${req.method} ${req.url}\n` +
        `    Continuando sin headers de tenant...`
      );
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

    // Log detallado en desarrollo ANTES de enviar el request
    if (this.isDevelopment()) {
      this.logTenantRequest(req, tenantHeaders, headersToAdd);
    }

    // Ejecutar el request y loguear la respuesta en desarrollo
    return next.handle(tenantRequest).pipe(
      tap({
        next: (event) => {
          if (this.isDevelopment() && event.type === 4) { // HttpEventType.Response = 4
            this.logTenantResponse(req, event, startTime);
          }
        },
        error: (error) => {
          if (this.isDevelopment()) {
            this.logTenantError(req, error, startTime);
          }
        }
      })
    );
  }

  /**
   * Verifica si estamos en modo desarrollo
   */
  private isDevelopment(): boolean {
    return this.envService.isDevelopment && this.envService.isConsoleLoggingEnabled;
  }

  /**
   * Log detallado de request con tenant headers (modo desarrollo)
   */
  private logTenantRequest(
    req: HttpRequest<any>,
    tenantHeaders: { slug: string | null; key: string | null },
    headersToAdd: { [key: string]: string }
  ): void {
    // Extraer el path relativo de la URL completa
    const urlObj = new URL(req.url);
    const relativePath = urlObj.pathname + urlObj.search;

    console.group(`🔐 [TenantHeaderInterceptor] ${req.method} ${relativePath}`);
    console.log('📍 URL completa:', req.url);
    console.log('🏢 Tenant Slug:', tenantHeaders.slug);
    console.log('🔑 Tenant Key:', tenantHeaders.key ? `${tenantHeaders.key.substring(0, 8)}...` : null);
    console.log('📋 Headers agregados:', headersToAdd);

    // Mostrar todos los headers del request (útil para debugging)
    const allHeaders: { [key: string]: string } = {};
    for (const key of req.headers.keys()) {
      allHeaders[key] = req.headers.get(key) || '';
    }
    console.log('📨 Todos los headers:', allHeaders);

    // Si hay body, mostrarlo
    if (req.body) {
      console.log('📦 Request Body:', req.body);
    }

    console.groupEnd();
  }

  /**
   * Log de respuesta exitosa (modo desarrollo)
   */
  private logTenantResponse(req: HttpRequest<any>, event: any, startTime: number): void {
    const duration = Math.round(performance.now() - startTime);
    const urlObj = new URL(req.url);
    const relativePath = urlObj.pathname + urlObj.search;

    console.group(`✅ [TenantHeaderInterceptor] ${req.method} ${relativePath} - ${event.status}`);
    console.log('⏱️  Duración:', `${duration}ms`);
    console.log('📊 Status:', event.status, event.statusText);
    console.log('📍 URL:', req.url);

    if (event.body) {
      console.log('📥 Response Body:', event.body);
    }

    console.groupEnd();
  }

  /**
   * Log de error (modo desarrollo)
   */
  private logTenantError(req: HttpRequest<any>, error: any, startTime: number): void {
    const duration = Math.round(performance.now() - startTime);
    const urlObj = new URL(req.url);
    const relativePath = urlObj.pathname + urlObj.search;

    console.group(`❌ [TenantHeaderInterceptor] ${req.method} ${relativePath} - ERROR`);
    console.error('⏱️  Duración:', `${duration}ms`);
    console.error('🚨 Status:', error.status, error.statusText);
    console.error('📍 URL:', req.url);
    console.error('💥 Error:', error.error || error.message);

    if (error.error) {
      console.error('📥 Error Body:', error.error);
    }

    console.groupEnd();
  }

  /**
   * Log de requests públicos (sin tenant headers)
   */
  private logPublicRequest(req: HttpRequest<any>): void {
    const urlObj = new URL(req.url);
    const relativePath = urlObj.pathname + urlObj.search;

    console.log(
      `🌐 [TenantHeaderInterceptor] ${req.method} ${relativePath} (público, sin tenant headers)`
    );
  }
}
