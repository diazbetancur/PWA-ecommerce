import { isPlatformBrowser } from '@angular/common';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  inject,
  isDevMode,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import {
  provideTransloco,
  translocoConfig,
  TranslocoService,
} from '@jsverse/transloco';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

// Importaciones de servicios y providers del core
import {
  TenantBootstrapService,
  ThemeService,
  ManifestService,
  LoggerService,
  AuthService,
  PushService,
  SeoService,
  provideTenantHeaderInterceptor
} from '@pwa/core';
import { GlobalErrorHandler } from './error-handler';
import { TranslocoHttpLoader } from './transloco-loader';

/**
 * Factory para el bootstrap del tenant con integración completa
 */
export function tenantBootstrapFactory(): () => Promise<void> {
  const tenantBootstrap = inject(TenantBootstrapService);
  const theme = inject(ThemeService);
  const manifest = inject(ManifestService);
  const logger = inject(LoggerService);
  const auth = inject(AuthService);
  const seo = inject(SeoService);
  const i18n = inject(TranslocoService);
  const platformId = inject(PLATFORM_ID);

  return async (): Promise<void> => {
    try {
      console.log('🚀 Iniciando bootstrap del tenant...');

      // 1. Ejecutar el bootstrap del tenant
      await tenantBootstrap.initialize();

      // 2. Obtener la configuración cargada
      const config = tenantBootstrap.getTenantConfig();

      if (config) {
        // 3. Aplicar la configuración usando los servicios existentes
        if (isPlatformBrowser(platformId)) {
          theme.applyTheme(config.theme);
          manifest.setTenantManifest(config);
        }

        seo.apply(config);
        logger.setContext({ tenant: config.tenant.slug });
        auth.init(config.tenant.slug);
        i18n.setActiveLang(config.locale || 'es-CO');

        // 4. Inicializar PushService solo en el browser
        if (isPlatformBrowser(platformId)) {
          const push = inject(PushService);
          push.init();
        }

        console.log('✅ Bootstrap del tenant completado:', config.tenant.displayName);
      } else {
        console.warn('⚠️ Bootstrap completado con configuración por defecto');
      }
    } catch (error) {
      console.error('❌ Error en el bootstrap del tenant:', error);
      // No lanzar el error para que la app continúe funcionando
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideClientHydration(withEventReplay()),

    // HTTP Client con interceptors (IMPORTANTE: incluir el interceptor de tenant)
    provideHttpClient(
      withFetch(),
      withInterceptors([])
    ),
    // Interceptor de headers de tenant (usando el provider clásico por compatibilidad)
    provideTenantHeaderInterceptor(),

    provideBrowserGlobalErrorListeners(),
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['es-CO', 'en-US'],
        defaultLang: 'es-CO',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      }),
      loader: TranslocoHttpLoader,
    }),

    // Bootstrap del tenant
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: tenantBootstrapFactory,
    },

    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
