# 🚨 Manejo de Errores Multi-Tenant - Guía Completa

Sistema robusto de manejo de errores para PWA multi-tenant con redirección automática y recovery.

## 📋 Características Implementadas

### ✅ **1. Estados de Tenant en TenantBootstrapService**
- 🔄 `tenantStatus`: `'loading' | 'ok' | 'error'`
- 🎯 Detección automática de fallos en `/api/tenant/resolve`
- 📊 Información detallada de errores con códigos específicos
- 🔍 Tracking del slug que se intentó cargar

### ✅ **2. Componente TenantNotFoundComponent**
- 💬 Mensaje amigable al usuario con detalles del error
- 🔄 Botón para cambiar tenant con input interactivo
- 📋 Lista de tenants sugeridos (demo-a, demo-b, demo-c)
- 🔧 Información de debug en desarrollo
- 🎨 UI responsive y accesible

### ✅ **3. APP_INITIALIZER Inteligente**
- 🚀 Inicialización automática del tenant
- 🎯 Redirección automática a `/tenant/not-found` si hay errores
- 🛡️ Manejo de errores críticos con fallback
- ⚡ Sin bloqueo de la aplicación

## 🏗️ Implementación Paso a Paso

### **Paso 1: Actualizar app.config.ts**

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { 
  TENANT_APP_INITIALIZER,
  TENANT_INTERCEPTOR_PROVIDER,
  TENANT_ERROR_ROUTES
} from '@pwa/core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // ⚠️ IMPORTANTE: Error routes PRIMERO
    provideRouter([
      ...TENANT_ERROR_ROUTES, // 🔴 Estas van PRIMERO
      ...routes               // 🔵 App routes después
    ]),
    
    // HTTP con interceptors de tenant
    provideHttpClient(
      withInterceptors([TENANT_INTERCEPTOR_PROVIDER])
    ),
    
    // 🚀 APP_INITIALIZER con manejo de errores
    TENANT_APP_INITIALIZER,
    
    // Otros providers...
    provideAnimations(),
    provideClientHydration()
  ]
};
```

### **Paso 2: Actualizar app.component.ts**

```typescript
import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TenantBootstrapService } from '@pwa/core';
import { LayoutComponent } from '@pwa/shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent],
  template: `
    @if (shouldShowLayout()) {
      <app-layout></app-layout>
    } @else {
      <router-outlet></router-outlet>
    }
  `
})
export class AppComponent {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly router = inject(Router);

  shouldShowLayout(): boolean {
    const currentUrl = this.router.url;
    
    // No mostrar layout en páginas de error de tenant
    return !currentUrl.includes('/tenant/not-found') && 
           !this.tenantBootstrap.hasError();
  }
}
```

### **Paso 3: Configurar app.routes.ts**

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/catalog', 
    pathMatch: 'full' 
  },
  {
    path: 'catalog',
    loadChildren: () => import('@pwa/features').then(m => m.CATALOG_FEATURE_ROUTES)
  },
  // Otras rutas de la app...
  { 
    path: '**', 
    redirectTo: '/catalog' 
  }
];

// ⚠️ NO incluir aquí las rutas de error de tenant
// Se agregan automáticamente en app.config.ts
```

## 🎯 Flujo de Manejo de Errores

### **Escenario 1: Tenant No Encontrado**
```bash
1. Usuario navega a: ?tenant=non-existent
2. TenantBootstrapService llama: /api/tenant/resolve?tenant=non-existent
3. Backend responde: 404 Not Found
4. Service actualiza: tenantStatus = 'error', code = 'NOT_FOUND'
5. APP_INITIALIZER detecta error
6. Router redirige automáticamente a: /tenant/not-found
7. TenantNotFoundComponent muestra UI amigable
```

### **Escenario 2: Error de Red**
```bash
1. Usuario navega a: ?tenant=demo-a
2. TenantBootstrapService intenta: /api/tenant/resolve?tenant=demo-a  
3. Red falla: Error 0, 500, 502, etc.
4. Service actualiza: tenantStatus = 'error', code = 'NETWORK_ERROR'
5. APP_INITIALIZER redirige a: /tenant/not-found
6. Usuario ve opción de reintentar
```

### **Escenario 3: Recovery Exitoso**
```bash
1. Usuario está en /tenant/not-found
2. Usuario ingresa: demo-b
3. TenantNotFoundComponent llama: tenantBootstrap.retryTenantLoad('demo-b')
4. URL actualizada: ?tenant=demo-b
5. Página recarga automáticamente
6. Tenant carga exitosamente: tenantStatus = 'ok'
7. Usuario regresa a la aplicación normal
```

## 🔧 API del TenantBootstrapService

### **Nuevas Propiedades**
```typescript
// Estados reactivos (signals)
readonly tenantStatus: Signal<'loading' | 'ok' | 'error'>
readonly tenantError: Signal<TenantError | null>  
readonly attemptedSlug: Signal<string | null>

// Métodos de utilidad
hasError(): boolean
getCurrentError(): TenantError | null
clearError(): void
retryTenantLoad(newSlug?: string): Promise<void>
```

### **Estructura TenantError**
```typescript
interface TenantError {
  code: 'NOT_FOUND' | 'NETWORK_ERROR' | 'INVALID_CONFIG' | 'UNKNOWN';
  message: string;
  slug?: string;
  timestamp: Date;
}
```

## 🎨 UI del TenantNotFoundComponent

### **Características de UX**
- 💔 **Mensaje claro**: Explica qué pasó y por qué
- 🔄 **Botón retry**: Reintenta el tenant actual  
- 📝 **Input de cambio**: Permite probar otro tenant
- 🎯 **Tenants sugeridos**: Botones rápidos (demo-a, demo-b, demo-c)
- 🏠 **Navegación alternativa**: Botones para ir a inicio o default
- 🔍 **Debug info**: Solo en desarrollo, muestra detalles técnicos

### **Estados Interactivos**
- ⏳ Loading states durante cambios de tenant
- ✋ Botones deshabilitados durante operaciones
- 🎨 Responsive design mobile-first
- ♿ Accesibilidad completa

## 📱 Testing de Escenarios

### **URLs de Prueba de Errores**
```bash
# Tenant que no existe
http://localhost:4200?tenant=non-existent-tenant

# Simular error de red (requiere backend mock)
http://localhost:4200?tenant=network-error-mock

# Tenant con configuración inválida
http://localhost:4200?tenant=invalid-config-mock
```

### **Testing Manual**
1. **Cargar tenant inexistente** → Debe redirigir a `/tenant/not-found`
2. **Cambiar a tenant válido** → Debe recargar y funcionar normal
3. **Usar botones sugeridos** → Debe cambiar tenant correctamente
4. **Reintentar tenant actual** → Debe recargar la página
5. **Ir a default** → Debe limpiar query params y usar default

## ⚠️ Consideraciones Importantes

### **Orden de Rutas**
```typescript
// ✅ CORRECTO
const routes = [
  ...TENANT_ERROR_ROUTES, // Primero las rutas de error
  ...appRoutes,          // Después las rutas de la app
  { path: '**', ... }    // Wildcard SIEMPRE al final
];

// ❌ INCORRECTO  
const routes = [
  ...appRoutes,          // App routes primero
  ...TENANT_ERROR_ROUTES, // Error routes después - puede no funcionar
];
```

### **Layout Condicional**
El `TenantNotFoundComponent` no debe usar el `LayoutComponent` porque:
- El layout depende del tenant para branding
- Si el tenant falla, el layout puede también fallar
- La página de error debe ser independiente

### **Performance**
- ⚡ APP_INITIALIZER no bloquea excesivamente
- 🔄 Redirects usan `replaceUrl: true` para no llenar history
- 💾 Estados se mantienen en signals para reactividad óptima

## 🚀 Extensiones Futuras

### **Posibles Mejoras**
1. **Cache de tenants**: Guardar tenants válidos en localStorage
2. **Retry automático**: Reintentar automáticamente en errores de red
3. **Tenant suggestions inteligentes**: Basadas en subdominios similares
4. **Analytics**: Trackear errores de tenant para mejoras
5. **Offline support**: Manejo cuando no hay conexión

### **Integración con Backend**
```typescript
// Endpoint sugerido para obtener tenants disponibles
GET /api/public/tenants/available
// Response: ['demo-a', 'demo-b', 'demo-c', ...]

// Endpoint para validar slug antes de cambio
GET /api/public/tenants/validate/:slug  
// Response: { valid: true, suggestions?: string[] }
```

---

## 🎉 **Sistema de Errores Completo Implementado!**

El sistema ahora maneja elegantemente todos los escenarios de fallo de tenant:

- 🔍 **Detección automática** de errores de tenant
- 🎯 **Redirección inteligente** a página de error amigable  
- 🔄 **Recovery fácil** para el usuario final
- 💪 **Robustez** ante fallos de red o configuración
- 🎨 **UX excelente** con feedback claro y opciones útiles

¡Listo para producción! 🚀
