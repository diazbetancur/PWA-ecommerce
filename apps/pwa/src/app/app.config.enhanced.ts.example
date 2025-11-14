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

// Importaciones de servicios del core
import {
  TenantBootstrapService,
  ThemeService,
  ManifestService,
  LoggerService,
  AuthService,
  PushService,
  SeoService
} from '@pwa/core';
import { GlobalErrorHandler } from './error-handler';
import { TranslocoHttpLoader } from './transloco-loader';

/**
 * Factory para el bootstrap mejorado del tenant
 * Este reemplaza el APP_INITIALIZER existente para TenantConfigService
 */
export function enhancedTenantBootstrapFactory(): () => Promise<void> {
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
      console.log('🚀 Iniciando bootstrap mejorado del tenant...');

      // 1. Primero ejecutar el bootstrap mejorado
      await tenantBootstrap.initialize();

      // 2. Obtener la configuración cargada por el bootstrap
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

        console.log('✅ Bootstrap del tenant completado exitosamente');
      } else {
        console.warn('⚠️ No se pudo obtener la configuración del tenant');
      }
    } catch (error) {
      console.error('❌ Error en el bootstrap del tenant:', error);
      // No lanzar el error para evitar que la app falle completamente
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([])),
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
    // Usar el bootstrap mejorado en lugar del original
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: enhancedTenantBootstrapFactory,
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
