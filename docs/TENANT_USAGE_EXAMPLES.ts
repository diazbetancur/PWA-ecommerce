/**
 * 💡 EJEMPLO PRÁCTICO: Usar TenantBootstrapService en tus Componentes
 *
 * Este archivo muestra cómo usar el tenant cargado desde el backend en tus componentes
 */

import { Component, computed, inject, OnInit } from '@angular/core';
import { TenantBootstrapService, TenantContextService } from '@pwa/core';

/**
 * Ejemplo 1: Verificar estado del tenant en un componente
 */
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <!-- Mostrar loader mientras carga el tenant -->
      @if (tenantBootstrap.isLoading()) {
        <div class="loading">
          <p>Cargando configuración del tenant...</p>
        </div>
      }

      <!-- Mostrar error si falla -->
      @else if (tenantBootstrap.hasErrorState()) {
        <div class="error">
          <p>Error: {{ tenantBootstrap.error()?.message }}</p>
          <button (click)="retryLoad()">Reintentar</button>
        </div>
      }

      <!-- Mostrar contenido cuando está listo -->
      @else if (tenantBootstrap.isReady()) {
        <div class="content">
          <h1>Bienvenido a {{ displayName() }}</h1>
          <p>Tenant: {{ tenantSlug() }}</p>
          <p>Moneda: {{ currency() }}</p>
          <p>Locale: {{ locale() }}</p>

          <!-- Usar colores del tenant -->
          <button [style.background-color]="primaryColor()">
            Botón con color del tenant
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
    }

    .loading, .error {
      text-align: center;
      padding: 3rem;
    }

    .error {
      color: var(--tenant-accent-color, #dc2626);
    }

    button {
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class DashboardComponent {
  // Inyectar servicios
  readonly tenantBootstrap = inject(TenantBootstrapService);
  readonly tenantContext = inject(TenantContextService);

  // Computed properties para reactividad automática
  readonly displayName = computed(() =>
    this.tenantBootstrap.currentTenant()?.tenant.displayName || 'Cargando...'
  );

  readonly tenantSlug = computed(() =>
    this.tenantContext.tenantSlug()
  );

  readonly currency = computed(() =>
    this.tenantContext.currency()
  );

  readonly locale = computed(() =>
    this.tenantContext.locale()
  );

  readonly primaryColor = computed(() =>
    this.tenantBootstrap.currentTenant()?.theme.primary || '#1976d2'
  );

  // Método para reintentar carga
  async retryLoad() {
    await this.tenantBootstrap.reloadTenant();
  }
}

/**
 * Ejemplo 2: Guard para proteger rutas hasta que el tenant esté cargado
 */
import { CanActivateFn, Router } from '@angular/router';

export const tenantLoadedGuard: CanActivateFn = () => {
  const tenantBootstrap = inject(TenantBootstrapService);
  const router = inject(Router);

  // Si el tenant no está cargado, esperar o redirigir
  if (!tenantBootstrap.isReady()) {
    console.warn('Tenant no está listo, redirigiendo...');
    return router.createUrlTree(['/loading']);
  }

  // Si hay error, redirigir a página de error
  if (tenantBootstrap.hasErrorState()) {
    console.error('Error con tenant, redirigiendo...');
    return router.createUrlTree(['/tenant/not-found']);
  }

  return true;
};

/**
 * Ejemplo 3: Servicio que usa la configuración del tenant
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly tenantContext = inject(TenantContextService);

  // Obtener moneda para formatear precios
  getFormattedPrice(price: number): string {
    const currency = this.tenantContext.getCurrency();
    const locale = this.tenantContext.getLocale();

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // Verificar si el tenant tiene una feature habilitada
  canUseAdvancedFeatures(): boolean {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.features?.apiAccess === true;
  }
}

/**
 * Ejemplo 4: Componente que muestra info de debugging
 */
@Component({
  selector: 'app-tenant-info',
  template: `
    <div class="tenant-info">
      <h3>Información del Tenant</h3>

      <div class="info-grid">
        <div class="info-item">
          <strong>Slug:</strong>
          <span>{{ tenantBootstrap.getTenantSlug() }}</span>
        </div>

        <div class="info-item">
          <strong>ID:</strong>
          <span>{{ tenantBootstrap.getTenantId() }}</span>
        </div>

        <div class="info-item">
          <strong>Estado:</strong>
          <span [class]="'status ' + tenantBootstrap.status()">
            {{ tenantBootstrap.status() }}
          </span>
        </div>

        <div class="info-item">
          <strong>Estrategia:</strong>
          <span>{{ tenantBootstrap.resolvedStrategy()?.type }}</span>
        </div>

        <div class="info-item">
          <strong>Moneda:</strong>
          <span>{{ tenantContext.getCurrency() }}</span>
        </div>

        <div class="info-item">
          <strong>Locale:</strong>
          <span>{{ tenantContext.getLocale() }}</span>
        </div>
      </div>

      <button (click)="showDebugInfo()">Ver Debug Info</button>
      <button (click)="clearCache()">Limpiar Cache</button>
    </div>
  `,
  styles: [`
    .tenant-info {
      background: var(--tenant-background-color, white);
      border: 1px solid var(--tenant-primary-color, #ccc);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item strong {
      color: var(--tenant-primary-color, #1976d2);
      font-size: 0.875rem;
    }

    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
    }

    .status.resolved {
      background: #d4edda;
      color: #155724;
    }

    .status.error, .status.not-found {
      background: #f8d7da;
      color: #721c24;
    }

    .status.resolving {
      background: #fff3cd;
      color: #856404;
    }

    button {
      margin-right: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--tenant-primary-color, #1976d2);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      opacity: 0.9;
    }
  `]
})
export class TenantInfoComponent {
  readonly tenantBootstrap = inject(TenantBootstrapService);
  readonly tenantContext = inject(TenantContextService);

  showDebugInfo() {
    const debug = this.tenantBootstrap.getDebugInfo();
    console.log('🔍 Tenant Debug Info:', debug);
    console.table({
      slug: debug.currentTenant?.tenant.slug,
      displayName: debug.currentTenant?.tenant.displayName,
      status: debug.status,
      hasError: debug.hasError,
      isReady: debug.isReady,
      cacheSize: debug.cacheSize
    });
  }

  clearCache() {
    this.tenantBootstrap.clearCache();
    console.log('🧹 Cache limpiado');
  }
}

/**
 * Ejemplo 5: Pipe personalizado que usa el tenant
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tenantPrice',
  standalone: true
})
export class TenantPricePipe implements PipeTransform {
  private readonly tenantContext = inject(TenantContextService);

  transform(value: number): string {
    const currency = this.tenantContext.getCurrency();
    const locale = this.tenantContext.getLocale();

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}

// Uso en template:
// <p>Precio: {{ product.price | tenantPrice }}</p>

/**
 * Ejemplo 6: Interceptor personalizado que verifica el tenant
 */
import { HttpInterceptorFn } from '@angular/common/http';

export const tenantCheckInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantBootstrap = inject(TenantBootstrapService);

  // Si el tenant no está listo, esperar
  if (!tenantBootstrap.isReady()) {
    console.warn('Tenant no listo, request bloqueada');
    // Aquí podrías implementar lógica para esperar
  }

  // Si hay error con el tenant, podrías cancelar la request
  if (tenantBootstrap.hasErrorState()) {
    console.error('Tenant con error, request cancelada');
    // throw new Error('Tenant not available');
  }

  return next(req);
};

/**
 * Ejemplo 7: Usar en efectos (Angular Signals)
 */
import { effect } from '@angular/core';

@Component({
  selector: 'app-analytics',
  template: `<div>Analytics tracking...</div>`
})
export class AnalyticsComponent {
  private readonly tenantBootstrap = inject(TenantBootstrapService);

  constructor() {
    // Effect que se ejecuta cuando el tenant cambia
    effect(() => {
      const tenant = this.tenantBootstrap.currentTenant();

      if (tenant && this.tenantBootstrap.isReady()) {
        // Inicializar analytics con datos del tenant
        this.initializeAnalytics(tenant.tenant.slug);
        console.log('📊 Analytics inicializado para tenant:', tenant.tenant.displayName);
      }
    });

    // Effect que reacciona a errores
    effect(() => {
      const error = this.tenantBootstrap.error();

      if (error) {
        // Enviar error a sistema de logging
        console.error('🚨 Error de tenant detectado:', error);
        // this.logErrorToService(error);
      }
    });
  }

  private initializeAnalytics(tenantSlug: string) {
    // Lógica de analytics aquí
    console.log('Tracking tenant:', tenantSlug);
  }
}

/**
 * Ejemplo 8: Subscription a cambios del tenant
 */
import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-theme-manager',
  template: `<div>Theme Manager</div>`
})
export class ThemeManagerComponent implements OnInit, OnDestroy {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private subscription?: Subscription;

  ngOnInit() {
    // Suscribirse a cambios del tenant (si necesitas RxJS)
    this.subscription = this.tenantBootstrap.tenantConfig$.subscribe(config => {
      if (config) {
        console.log('🎨 Tenant config actualizado:', config.tenant.displayName);
        this.applyTheme(config.theme);
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private applyTheme(theme: any) {
    // Aplicar theme personalizado
    console.log('Aplicando theme:', theme);
  }
}

/**
 * 📝 NOTAS IMPORTANTES:
 *
 * 1. Prefiere usar Signals y computed() sobre subscriptions RxJS
 *    - Son más eficientes
 *    - Se limpian automáticamente
 *    - Mejor integración con Angular moderno
 *
 * 2. El tenant se carga ANTES de que la app arranque (APP_INITIALIZER)
 *    - No necesitas esperar en componentes normales
 *    - Solo verifica isReady() si necesitas asegurarte
 *
 * 3. TenantContextService es una capa de abstracción
 *    - Úsalo para acceso rápido a datos del tenant
 *    - Es más limpio que inyectar TenantBootstrapService en todos lados
 *
 * 4. Los headers X-Tenant-Slug y X-Tenant-Key se agregan automáticamente
 *    - No necesitas preocuparte por esto en tus servicios
 *    - El interceptor lo maneja transparentemente
 *
 * 5. Las CSS variables están disponibles inmediatamente después de cargar
 *    - Úsalas en tus styles para tener un diseño reactivo al tenant
 */
