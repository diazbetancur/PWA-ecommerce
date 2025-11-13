import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  TENANT_APP_INITIALIZER,
  TENANT_INTERCEPTOR_PROVIDER,
  TENANT_ERROR_ROUTES
} from '@pwa/core';

// Import your app routes
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router con las rutas de error de tenant incluidas
    provideRouter([
      ...TENANT_ERROR_ROUTES, // Rutas de error DEBEN ir primero
      ...routes               // Luego las rutas de la aplicación
    ], withEnabledBlockingInitialNavigation()),

    // HTTP Client con interceptors
    provideHttpClient(
      withInterceptors([TENANT_INTERCEPTOR_PROVIDER])
    ),

    // APP_INITIALIZER para manejo de errores de tenant
    TENANT_APP_INITIALIZER,

    // Otras configuraciones
    provideClientHydration(),
    provideAnimations(),

    // Aquí puedes agregar otros providers según necesites
    // provideStore(),
    // provideEffects(),
    // etc.
  ],
};

/*
IMPORTANTE: Orden de las rutas

Las TENANT_ERROR_ROUTES DEBEN ir antes que las rutas principales porque:

1. `/tenant/not-found` debe estar disponible incluso si el tenant falla
2. El APP_INITIALIZER puede redirigir aquí antes de que se evalúen otras rutas
3. Evita conflictos de routing si tienes rutas comodín (/**)

Ejemplo de app.routes.ts:

export const routes: Routes = [
  { path: '', redirectTo: '/catalog', pathMatch: 'full' },
  {
    path: 'catalog',
    loadChildren: () => import('@pwa/features').then(m => m.CATALOG_FEATURE_ROUTES)
  },
  { path: '**', redirectTo: '/catalog' }  // Wildcard SIEMPRE al final
];

Resultado final del routing:
[
  { path: 'tenant/not-found', component: TenantNotFoundComponent }, // Primero
  { path: 'tenant/error', redirectTo: 'tenant/not-found' },        // Primero
  { path: '', redirectTo: '/catalog', pathMatch: 'full' },         // Después
  { path: 'catalog', loadChildren: ... },                         // Después
  { path: '**', redirectTo: '/catalog' }                          // Último
]
*/
