import { Provider } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TenantHeaderInterceptor } from '../interceptors/tenant-header.interceptor';

/**
 * Provider para registrar el interceptor de headers de tenant
 * Úsalo en el applicationConfig junto con provideHttpClient
 */
export const provideTenantHeaderInterceptor = (): Provider => ({
  provide: HTTP_INTERCEPTORS,
  useClass: TenantHeaderInterceptor,
  multi: true
});

/**
 * Provider múltiple para varios interceptors relacionados con tenant
 * Útil para futuras extensiones (autenticación, logging, etc.)
 */
export const provideTenantInterceptors = (): Provider[] => [
  provideTenantHeaderInterceptor()
  // Aquí se pueden agregar más interceptors en el futuro:
  // provideTenantAuthInterceptor(),
  // provideTenantLoggingInterceptor(),
];
