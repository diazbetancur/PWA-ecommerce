import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppEnvService } from './app-env.service';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?:
    | HttpParams
    | {
        [param: string]:
          | string
          | number
          | boolean
          | ReadonlyArray<string | number | boolean>;
      };
  observe?: 'body';
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

export interface ApiRequestOptionsWithResponse
  extends Omit<ApiRequestOptions, 'observe'> {
  observe: 'response';
}

export interface ApiClientOptions {
  enableLogging?: boolean;
  enableErrorHandling?: boolean;
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly envService = inject(AppEnvService);

  private readonly defaultOptions: ApiClientOptions = {
    enableLogging: this.envService.isConsoleLoggingEnabled,
    enableErrorHandling: true,
    timeout: 30000,
  };

  private buildFullUrl(relativePath: string): string {
    if (!relativePath.startsWith('/')) {
      throw new Error(
        `ApiClientService: El path debe ser relativo y empezar con '/'. Recibido: ${relativePath}`
      );
    }
    if (
      relativePath.startsWith('http://') ||
      relativePath.startsWith('https://')
    ) {
      throw new Error(
        `ApiClientService: Solo se permiten paths relativos. Recibido: ${relativePath}`
      );
    }

    const baseUrl = this.envService.apiBaseUrl;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${relativePath}`;
  }

  get<T = unknown>(
    relativePath: string,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.executeRequest<T>(
      'GET',
      relativePath,
      undefined,
      options,
      clientOptions
    );
  }

  getWithResponse<T = unknown>(
    relativePath: string,
    options?: ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<HttpResponse<T>> {
    const finalOptions = { ...options, observe: 'response' as const };
    return this.executeRequest<HttpResponse<T>>(
      'GET',
      relativePath,
      undefined,
      finalOptions,
      clientOptions
    );
  }

  post<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>(
      'POST',
      relativePath,
      body,
      options,
      clientOptions
    );
  }

  postWithResponse<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<HttpResponse<TResponse>> {
    const finalOptions = { ...options, observe: 'response' as const };
    return this.executeRequest<HttpResponse<TResponse>>(
      'POST',
      relativePath,
      body,
      finalOptions,
      clientOptions
    );
  }

  put<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>(
      'PUT',
      relativePath,
      body,
      options,
      clientOptions
    );
  }

  patch<TResponse = unknown, TBody = unknown>(
    relativePath: string,
    body: TBody,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.executeRequest<TResponse>(
      'PATCH',
      relativePath,
      body,
      options,
      clientOptions
    );
  }

  delete<T = unknown>(
    relativePath: string,
    options?: ApiRequestOptions,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.executeRequest<T>(
      'DELETE',
      relativePath,
      undefined,
      options,
      clientOptions
    );
  }

  private executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    relativePath: string,
    body?: unknown,
    options?: ApiRequestOptions | ApiRequestOptionsWithResponse,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    const config = { ...this.defaultOptions, ...clientOptions };
    const startTime = performance.now();
    const fullUrl = this.buildFullUrl(relativePath);

    if (config.enableLogging && this.envService.isConsoleLoggingEnabled) {
      this.logRequest(method, relativePath, body);
    }

    let request$: Observable<any>;

    switch (method) {
      case 'GET':
        request$ = this.http.get(fullUrl, options as any);
        break;
      case 'POST':
        request$ = this.http.post(fullUrl, body, options as any);
        break;
      case 'PUT':
        request$ = this.http.put(fullUrl, body, options as any);
        break;
      case 'PATCH':
        request$ = this.http.patch(fullUrl, body, options as any);
        break;
      case 'DELETE':
        request$ = this.http.delete(fullUrl, options as any);
        break;
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }

    if (config.enableLogging && this.envService.isConsoleLoggingEnabled) {
      request$ = request$.pipe(
        tap((response) =>
          this.logResponse(method, relativePath, startTime, response)
        )
      );
    }
    if (config.enableErrorHandling) {
      request$ = request$.pipe(
        catchError((error) =>
          this.handleError(method, relativePath, error, startTime)
        )
      );
    }

    return request$ as Observable<T>;
  }

  private logRequest(
    method: string,
    relativePath: string,
    body?: unknown
  ): void {
    console.group(
      `%c🚀 API ${method} ${relativePath}`,
      'color: #0070f3; font-weight: bold'
    );
    if (body) console.log('%cBody:', 'color: #0070f3', body);
    console.groupEnd();
  }

  private logResponse(
    method: string,
    relativePath: string,
    startTime: number,
    response: unknown
  ): void {
    const duration = Math.round(performance.now() - startTime);
    console.group(
      `%c✅ API ${method} ${relativePath} - ${duration}ms`,
      'color: #22c55e; font-weight: bold'
    );
    console.log('%cResponse:', 'color: #22c55e', response);
    console.groupEnd();
  }

  private handleError(
    method: string,
    relativePath: string,
    error: unknown,
    startTime: number
  ): Observable<never> {
    const duration = Math.round(performance.now() - startTime);
    if (this.envService.isConsoleLoggingEnabled) {
      console.group(
        `%c❌ API ${method} ${relativePath} - ${duration}ms`,
        'color: #ef4444; font-weight: bold'
      );
      console.error('%cError:', 'color: #ef4444', error);
      console.groupEnd();
    }
    return throwError(() => error);
  }

  buildParams(
    params: Record<string, string | number | boolean | null | undefined>
  ): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, value.toString());
      }
    }
    return httpParams;
  }

  buildHeaders(headers: Record<string, string>): HttpHeaders {
    return new HttpHeaders(headers);
  }

  getWithParams<T = unknown>(
    relativePath: string,
    params: Record<string, string | number | boolean | null | undefined>,
    options?: Omit<ApiRequestOptions, 'params'>,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    return this.get<T>(
      relativePath,
      { ...options, params: this.buildParams(params) },
      clientOptions
    );
  }

  postWithHeaders<TResponse = unknown, TBody = unknown>(
    url: string,
    body: TBody,
    headers: Record<string, string>,
    options?: Omit<ApiRequestOptions, 'headers'>,
    clientOptions?: ApiClientOptions
  ): Observable<TResponse> {
    return this.post<TResponse, TBody>(
      url,
      body,
      { ...options, headers: this.buildHeaders(headers) },
      clientOptions
    );
  }

  uploadFile<T = unknown>(
    url: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, string | Blob>,
    clientOptions?: ApiClientOptions
  ): Observable<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, value);
      }
    }
    return this.post<T>(url, formData, undefined, clientOptions);
  }

  getHealthCheck(): Observable<{
    status: string;
    timestamp: string;
    version?: string;
  }> {
    return this.get<{ status: string; timestamp: string; version?: string }>(
      '/health',
      {},
      { enableLogging: true, timeout: 5000 }
    );
  }

  getTenantConfig(tenantSlug: string): Observable<unknown> {
    return this.get(`/api/public/tenant/${tenantSlug}`);
  }

  getCatalog<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    const path = `/api/catalog/${endpoint}`;
    return params ? this.getWithParams<T>(path, params) : this.get<T>(path);
  }

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

  getFullUrl(relativePath: string): string {
    return this.buildFullUrl(relativePath);
  }

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
      environment: this.envService.isProduction ? 'production' : 'development',
    };
  }
}
