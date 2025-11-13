import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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
 * Servicio cliente API que se beneficia automáticamente del TenantHeaderInterceptor
 * Incluye logging, manejo de errores y tipado mejorado
 */
@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly isDev = isDevMode();

  /** Configuración por defecto */
  private readonly defaultOptions: ApiClientOptions = {
    enableLogging: this.isDev,
    enableErrorHandling: true,
    timeout: 30000
  };

  // ============================================================================
  // MÉTODOS HTTP TIPADOS CON LOGGING Y MANEJO DE ERRORES
  // ============================================================================

  /**
   * Realiza una petición GET tipada con logging automático
   * @param url - URL del endpoint
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  get<T = unknown>(
    url: string,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.executeRequest<T>('GET', url, undefined, options, clientOptions);
  }

  /**
   * Realiza una petición GET que retorna la respuesta completa
   * @param url - URL del endpoint
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con HttpResponse completo
   */
  getWithResponse<T = unknown>(
    url: string,
    options?: ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<HttpResponse<T>> {
    const finalOptions = { ...options, observe: 'response' as const };
    return this.executeRequest<HttpResponse<T>>('GET', url, undefined, finalOptions, clientOptions);
  }

  /**
   * Realiza una petición POST tipada
   * @param url - URL del endpoint
   * @param body - Cuerpo de la petición (tipado)
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  post<TResponse = unknown, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>('POST', url, body, options, clientOptions);
  }

  /**
   * Realiza una petición POST que retorna la respuesta completa
   * @param url - URL del endpoint
   * @param body - Cuerpo de la petición
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con HttpResponse completo
   */
  postWithResponse<TResponse = unknown, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<HttpResponse<TResponse>> {
    const finalOptions = { ...options, observe: 'response' as const };
    return this.executeRequest<HttpResponse<TResponse>>('POST', url, body, finalOptions, clientOptions);
  }

  /**
   * Realiza una petición PUT tipada
   * @param url - URL del endpoint
   * @param body - Cuerpo de la petición (tipado)
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  put<TResponse = unknown, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>('PUT', url, body, options, clientOptions);
  }

  /**
   * Realiza una petición PATCH tipada
   * @param url - URL del endpoint
   * @param body - Cuerpo de la petición (tipado)
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  patch<TResponse = unknown, TBody = unknown>(
    url: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>('PATCH', url, body, options, clientOptions);
  }

  /**
   * Realiza una petición DELETE tipada
   * @param url - URL del endpoint
   * @param options - Opciones de la petición
   * @param clientOptions - Configuración del cliente API
   * @returns Observable con la respuesta tipada
   */
  delete<T = unknown>(
    url: string,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.executeRequest<T>('DELETE', url, undefined, options, clientOptions);
  }

  // ============================================================================
  // MÉTODO PRIVADO PARA EJECUTAR REQUESTS CON LOGGING Y MANEJO DE ERRORES
  // ============================================================================

  /**
   * Método interno que maneja todas las peticiones HTTP con logging y errores
   */
  private executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
    options?: ApiRequestOptions | ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    const config = { ...this.defaultOptions, ...clientOptions };
    const startTime = performance.now();

    // Log de inicio de request (solo en desarrollo)
    if (config.enableLogging && this.isDev) {
      this.logRequest(method, url, body);
    }

    let request$: Observable<T>;

    // Crear la request según el método
    switch (method) {
      case 'GET':
        request$ = this.http.get<T>(url, options) as Observable<T>;
        break;
      case 'POST':
        request$ = this.http.post<T>(url, body, options) as Observable<T>;
        break;
      case 'PUT':
        request$ = this.http.put<T>(url, body, options) as Observable<T>;
        break;
      case 'PATCH':
        request$ = this.http.patch<T>(url, body, options) as Observable<T>;
        break;
      case 'DELETE':
        request$ = this.http.delete<T>(url, options) as Observable<T>;
        break;
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }

    // Agregar logging y manejo de errores
    return request$.pipe(
      // Log de respuesta exitosa
      ...(config.enableLogging && this.isDev
        ? [tap((response) => this.logResponse(method, url, startTime, response))]
        : []),

      // Manejo de errores si está habilitado
      ...(config.enableErrorHandling
        ? [catchError((error) => this.handleError(method, url, error, startTime))]
        : [])
    ) as Observable<T>;
  }

  /**
   * Log de request saliente (solo en desarrollo)
   */
  private logRequest(method: string, url: string, body?: unknown): void {
    const timestamp = new Date().toISOString();
    console.group(`%c🚀 API Request [${timestamp}]`, 'color: #0070f3; font-weight: bold');
    console.log(`%c${method}%c ${url}`, 'color: #0070f3; font-weight: bold', 'color: #666');

    if (body) {
      console.log('%cBody:', 'color: #0070f3', body);
    }

    console.groupEnd();
  }

  /**
   * Log de respuesta (solo en desarrollo)
   */
  private logResponse(method: string, url: string, startTime: number, response: unknown): void {
    const duration = Math.round(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    console.group(`%c✅ API Response [${timestamp}] - ${duration}ms`, 'color: #22c55e; font-weight: bold');
    console.log(`%c${method}%c ${url}`, 'color: #22c55e; font-weight: bold', 'color: #666');
    console.log('%cResponse:', 'color: #22c55e', response);
    console.groupEnd();
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(method: string, url: string, error: unknown, startTime: number): Observable<never> {
    const duration = Math.round(performance.now() - startTime);
    const timestamp = new Date().toISOString();

    // Log del error (solo en desarrollo)
    if (this.isDev) {
      console.group(`%c❌ API Error [${timestamp}] - ${duration}ms`, 'color: #ef4444; font-weight: bold');
      console.log(`%c${method}%c ${url}`, 'color: #ef4444; font-weight: bold', 'color: #666');
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
   * @param url - URL del endpoint
   * @param params - Parámetros de query
   * @param options - Opciones adicionales
   * @param clientOptions - Configuración del cliente
   * @returns Observable con la respuesta tipada
   */
  getWithParams<T = unknown>(
    url: string,
    params: Record<string, string | number | boolean | null | undefined>,
    options?: Omit<ApiRequestOptions, 'params'>,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.get<T>(url, {
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
   * @param url - URL del endpoint
   * @param method - Método HTTP
   * @param body - Cuerpo de la petición (opcional)
   * @param timeout - Timeout en ms
   * @param options - Opciones adicionales
   * @returns Observable con la respuesta tipada
   */
  withTimeout<T = unknown>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    timeout = 5000,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.executeRequest<T>(method, url, body, options, { timeout });
  }
}
