import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppEnvService } from './app-env.service';

/**
 * Opciones base para requests HTTP
 */
export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  observe?: 'body';
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

/**
 * Opciones extendidas que incluyen observe: 'response'
 */
export interface ApiRequestOptionsWithResponse extends Omit<ApiRequestOptions, 'observe'> {
  observe: 'response';
}

/**
 * Opciones avanzadas para el ApiClient
 */
export interface ApiClientOptions {
  /** Habilitar logging automático de requests/responses (solo en dev) */
  enableLogging?: boolean;
  /** Habilitar manejo automático de errores */
  enableErrorHandling?: boolean;
  /** Timeout personalizado en ms */
  timeout?: number;
}

/**
 * Configuración de error personalizada
 */
export interface ApiErrorConfig {
  /** Mostrar toast de error automáticamente */
  showToast?: boolean;
  /** Mensaje personalizado de error */
  customMessage?: string;
  /** Re-throw el error después del manejo */
  rethrow?: boolean;
}

/**
 * Información de respuesta para logging
 */
interface ApiLogInfo {
  method: string;
  url: string;
  duration: number;
  status?: number;
  size?: number;
}

/**
 * Servicio cliente API que construye URLs automáticamente usando la base URL del entorno
 * - Recibe solo paths relativos (ej: '/api/catalog/products')
 * - Construye automáticamente: ${apiBaseUrl}${relativePath}
 * - Se integra con TenantHeaderInterceptor automáticamente
 * - Incluye logging inteligente y manejo de errores
 */
@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly envService = inject(AppEnvService);

  /** Configuración por defecto basada en el entorno */
  private readonly defaultOptions: ApiClientOptions = {
    enableLogging: this.envService.isConsoleLoggingEnabled,
    enableErrorHandling: true,
    timeout: 30000
  };

  /**
   * Construye la URL completa combinando base URL + path relativo
   * @param relativePath - Path relativo (debe empezar con /)
   * @returns URL completa para el request
   */
  private buildFullUrl(relativePath: string): string {
    // Validar que el path sea relativo
    if (!relativePath.startsWith('/')) {
      throw new Error(`ApiClientService: El path debe ser relativo y empezar con '/'. Recibido: ${relativePath}`);
    }

    // Validar que no sea una URL absoluta
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      throw new Error(`ApiClientService: Se recibió una URL absoluta. Solo se permiten paths relativos. Recibido: ${relativePath}`);
    }

    const baseUrl = this.envService.apiBaseUrl;

    // Remover trailing slash del baseUrl si existe
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Construir URL completa
    const fullUrl = `${cleanBaseUrl}${relativePath}`;

    // Log de construcción de URL en modo debug
    if (this.envService.isDevelopment && this.envService.loggingLevel === 'debug') {
      console.log(`🔗 URL Built: ${fullUrl}`, {
        baseUrl: cleanBaseUrl,
        relativePath,
        mockApi: this.envService.useMockApi
      });
    }

    return fullUrl;
  }

  // ============================================================================
  // MÉTODOS HTTP TIPADOS CON LOGGING Y MANEJO DE ERRORES
  // ============================================================================

  /**
   * Realiza una petición GET tipada con logging automático
   * @param relativePath - Path relativo (ej: '/api/catalog/products')
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  get<T = unknown>(
    relativePath: string,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.executeRequest<T>('GET', relativePath, undefined, options, clientOptions);
  }

  /**
   * Realiza una petición GET que retorna la respuesta completa
   * @param relativePath - Path relativo (ej: '/api/catalog/products')
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con HttpResponse completo
   */
  getWithResponse<T = unknown>(
    relativePath: string,
    options?: ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<HttpResponse<T>> {
    const finalOptions = { ...options, observe: 'response' as const };
    return this.executeRequest<HttpResponse<T>>('GET', relativePath, undefined, finalOptions, clientOptions);
  }

  /**
   * Realiza una petición POST tipada
   * @param relativePath - Path relativo (ej: '/api/orders')
   * @param body - Cuerpo de la petición (tipado)
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  post<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>('POST', relativePath, body, options, clientOptions);
  }

  /**
   * Realiza una petición POST que retorna la respuesta completa
   * @param relativePath - Path relativo (ej: '/api/orders')
   * @param body - Cuerpo de la petición
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con HttpResponse completo
   */
  postWithResponse<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<HttpResponse<TResponse>> {
    const finalOptions = { ...options, observe: 'response' as const };
    return this.executeRequest<HttpResponse<TResponse>>('POST', relativePath, body, finalOptions, clientOptions);
  }

  /**
   * Realiza una petición PUT tipada
   * @param relativePath - Path relativo (ej: '/api/products/123')
   * @param body - Cuerpo de la petición (tipado)
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  put<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>('PUT', relativePath, body, options, clientOptions);
  }

  /**
   * Realiza una petición PATCH tipada
   * @param relativePath - Path relativo (ej: '/api/products/123')
   * @param body - Cuerpo de la petición (tipado)
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  patch<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>('PATCH', relativePath, body, options, clientOptions);
  }

  /**
   * Realiza una petición DELETE tipada
   * @param relativePath - Path relativo (ej: '/api/products/123')
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  delete<T = unknown>(
    relativePath: string,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.executeRequest<T>('DELETE', relativePath, undefined, options, clientOptions);
  }

  // ============================================================================
  // MÉTODO PRIVADO PARA EJECUTAR REQUESTS CON LOGGING Y MANEJO DE ERRORES
  // ============================================================================

  /**
   * Método interno que maneja todas las peticiones HTTP con logging y errores
   * Construye automáticamente la URL completa usando baseUrl + relativePath
   */
  private executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    relativePath: string,
    body?: unknown,
    options?: ApiRequestOptions | ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    const config = { ...this.defaultOptions, ...clientOptions };
    const startTime = performance.now();

    // Construir URL completa
    const fullUrl = this.buildFullUrl(relativePath);

    // Log de inicio de request (usar relativePath para logs más limpios)
    if (config.enableLogging && this.envService.isConsoleLoggingEnabled) {
      this.logRequest(method, relativePath, body, fullUrl);
    }

    let request$: Observable<T>;

    // Crear la request según el método usando la URL completa
    switch (method) {
      case 'GET':
        request$ = this.http.get<T>(fullUrl, options) as Observable<T>;
        break;
      case 'POST':
        request$ = this.http.post<T>(fullUrl, body, options) as Observable<T>;
        break;
      case 'PUT':
        request$ = this.http.put<T>(fullUrl, body, options) as Observable<T>;
        break;
      case 'PATCH':
        request$ = this.http.patch<T>(fullUrl, body, options) as Observable<T>;
        break;
      case 'DELETE':
        request$ = this.http.delete<T>(fullUrl, options) as Observable<T>;
        break;
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }

    // Agregar logging y manejo de errores
    return request$.pipe(
      // Log de respuesta exitosa
      ...(config.enableLogging && this.envService.isConsoleLoggingEnabled
        ? [tap((response) => this.logResponse(method, relativePath, startTime, response, fullUrl))]
        : []),

      // Manejo de errores si está habilitado
      ...(config.enableErrorHandling
        ? [catchError((error) => this.handleError(method, relativePath, error, startTime, fullUrl))]
        : [])
    ) as Observable<T>;
  }

  /**
   * Log de request saliente (mejorado con información de URL construction)
   */
  private logRequest(method: string, relativePath: string, body?: unknown, fullUrl?: string): void {
    const timestamp = new Date().toISOString();
    console.group(`%c🚀 API Request [${timestamp}]`, 'color: #0070f3; font-weight: bold');
    console.log(`%c${method}%c ${relativePath}`, 'color: #0070f3; font-weight: bold', 'color: #666');

    if (this.envService.loggingLevel === 'debug' && fullUrl) {
      console.log('%cFull URL:', 'color: #0070f3; font-size: 0.9em', fullUrl);
      console.log('%cBase URL:', 'color: #0070f3; font-size: 0.9em', this.envService.apiBaseUrl);
      console.log('%cMock API:', 'color: #0070f3; font-size: 0.9em', this.envService.useMockApi);
    }

    if (body) {
      console.log('%cBody:', 'color: #0070f3', body);
    }

    console.groupEnd();
  }

  /**
   * Log de respuesta (mejorado con información de construcción de URL)
   */
  private logResponse(method: string, relativePath: string, startTime: number, response: unknown, fullUrl?: string): void {
    const duration = Math.round(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    console.group(`%c✅ API Response [${timestamp}] - ${duration}ms`, 'color: #22c55e; font-weight: bold');
    console.log(`%c${method}%c ${relativePath}`, 'color: #22c55e; font-weight: bold', 'color: #666');

    if (this.envService.loggingLevel === 'debug' && fullUrl) {
      console.log('%cFull URL:', 'color: #22c55e; font-size: 0.9em', fullUrl);
    }

    console.log('%cResponse:', 'color: #22c55e', response);
    console.groupEnd();
  }

  /**
   * Manejo de errores HTTP (mejorado)
   */
  private handleError(method: string, relativePath: string, error: unknown, startTime: number, fullUrl?: string): Observable<never> {
    const duration = Math.round(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    // Log del error basado en configuración del entorno
    if (this.envService.isConsoleLoggingEnabled) {
      console.group(`%c❌ API Error [${timestamp}] - ${duration}ms`, 'color: #ef4444; font-weight: bold');
      console.log(`%c${method}%c ${relativePath}`, 'color: #ef4444; font-weight: bold', 'color: #666');

      if (this.envService.loggingLevel === 'debug' && fullUrl) {
        console.log('%cFull URL:', 'color: #ef4444; font-size: 0.9em', fullUrl);
      }

      console.error('%cError:', 'color: #ef4444', error);
      console.groupEnd();
    }

    // Re-throw el error para que lo maneje el consumidor
    return throwError(() => error);
  }

  // ============================================================================
  // MÉTODOS DE UTILIDAD MEJORADOS
  // ============================================================================

  /**
   * Construye parámetros de query de forma typesafe
   * @param params - Objeto con los parámetros
   * @returns HttpParams
   */
  buildParams(params: Record<string, string | number | boolean | null | undefined>): HttpParams {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, value.toString());
      }
    }

    return httpParams;
  }

  /**
   * Construye headers de forma typesafe
   * @param headers - Objeto con los headers
   * @returns HttpHeaders
   */
  buildHeaders(headers: Record<string, string>): HttpHeaders {
    return new HttpHeaders(headers);
  }

  /**
   * Método de conveniencia para GET con parámetros tipado
   * @param relativePath - Path relativo (ej: '/api/products')
   * @param params - Parámetros de query
   * @param options - Opciones adicionales
   * @param clientOptions - Configuración del cliente
   * @returns Observable con la respuesta tipada
   */
  getWithParams<T = unknown>(
    relativePath: string,
    params: Record<string, string | number | boolean | null | undefined>,
    options?: Omit<ApiRequestOptions, 'params'>,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.get<T>(relativePath, {
      ...options,
      params: this.buildParams(params)
    }, clientOptions);
  }

  /**
   * Método de conveniencia para POST con headers personalizados tipado
   * @param url - URL del endpoint
   * @param body - Cuerpo de la petición
   * @param headers - Headers personalizados
   * @param options - Opciones adicionales
   * @param clientOptions - Configuración del cliente
   * @returns Observable con la respuesta tipada
   */
  postWithHeaders<TResponse = unknown, TBody = unknown>(
    url: string,
    body: TBody,
    headers: Record<string, string>,
    options?: Omit<ApiRequestOptions, 'headers'>,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.post<TResponse, TBody>(url, body, {
      ...options,
      headers: this.buildHeaders(headers)
    }, clientOptions);
  }

  /**
   * Método de conveniencia para upload de archivos
   * @param url - URL del endpoint
   * @param file - Archivo a subir
   * @param fieldName - Nombre del campo (por defecto 'file')
   * @param additionalData - Datos adicionales para el FormData
   * @param clientOptions - Configuración del cliente
   * @returns Observable con la respuesta tipada
   */
  uploadFile<T = unknown>(
    url: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, string | Blob>,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    // Agregar datos adicionales si los hay
    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, value);
      }
    }

    return this.post<T>(url, formData, undefined, clientOptions);
  }

  /**
   * Método para requests con timeout personalizado
   * @param relativePath - Path relativo (ej: '/api/products')
   * @param method - Método HTTP
   * @param body - Cuerpo de la petición (opcional)
   * @param timeout - Timeout en ms
   * @param options - Opciones adicionales
   * @returns Observable con la respuesta tipada
   */
  withTimeout<T = unknown>(
    relativePath: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    timeout = 5000,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.executeRequest<T>(method, relativePath, body, options, { timeout });
  }

  // ============================================================================
  // MÉTODOS DE UTILIDAD ESPECÍFICOS PARA LA APLICACIÓN
  // ============================================================================

  /**
   * Obtiene información de conectividad con el backend
   * @returns Observable con información del health del API
   */
  getHealthCheck(): Observable<{ status: string; timestamp: string; version?: string }> {
    return this.get<{ status: string; timestamp: string; version?: string }>('/health', {}, {
      enableLogging: true,
      timeout: 5000
    });
  }

  /**
   * Obtiene configuración del tenant público
   * @param tenantSlug - Slug del tenant
   * @returns Observable con la configuración del tenant
   */
  getTenantConfig(tenantSlug: string): Observable<unknown> {
    return this.getWithParams('/api/public/tenant/resolve', {
      slug: tenantSlug
    });
  }

  /**
   * Método de conveniencia para endpoints de catálogo
   * @param endpoint - Endpoint específico (ej: 'products', 'categories')
   * @param params - Parámetros de filtrado
   * @returns Observable con los resultados del catálogo
   */
  getCatalog<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    const path = `/api/catalog/${endpoint}`;
    return params ? this.getWithParams<T>(path, params) : this.get<T>(path);
  }

  /**
   * Método de conveniencia para endpoints de administración
   * @param endpoint - Endpoint específico
   * @param method - Método HTTP
   * @param body - Cuerpo de la petición (para POST/PUT/PATCH)
   * @param params - Parámetros de query
   * @returns Observable con la respuesta
   */
  admin<T = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    const path = `/api/admin/${endpoint}`;
    const options = params ? { params: this.buildParams(params) } : undefined;

    switch (method) {
      case 'GET':
        return this.get<T>(path, options);
      case 'POST':
        return this.post<T>(path, body, options);
      case 'PUT':
        return this.put<T>(path, body, options);
      case 'PATCH':
        return this.patch<T>(path, body, options);
      case 'DELETE':
        return this.delete<T>(path, options);
    }
  }

  /**
   * Obtiene la URL completa que se usaría para un path relativo
   * Útil para debugging o logs
   * @param relativePath - Path relativo
   * @returns URL completa que sería usada
   */
  getFullUrl(relativePath: string): string {
    return this.buildFullUrl(relativePath);
  }

  /**
   * Obtiene información de configuración del cliente API
   * @returns Objeto con información de configuración actual
   */
  getClientInfo(): {
    baseUrl: string;
    mockApi: boolean;
    loggingEnabled: boolean;
    environment: string;
  } {
    return {
      baseUrl: this.envService.apiBaseUrl,
      mockApi: this.envService.useMockApi,
      loggingEnabled: this.envService.isConsoleLoggingEnabled,
      environment: this.envService.isProduction ? 'production' : 'development'
    };
  }
}
