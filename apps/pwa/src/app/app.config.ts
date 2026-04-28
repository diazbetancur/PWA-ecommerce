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

// Core providers (will be implemented in core lib)
import {
  APP_ENV,
  APP_ENV_INITIALIZER,
  AppError,
  AuthService,
  authTenantInterceptor,
  GlobalErrorHandler,
  HTTP_ERROR_NOTIFIER,
  LoggerService,
  ManifestService,
  PushService,
  SeoService,
  TenantConfigService,
  TenantResolutionService,
  ThemeService,
  TranslocoHttpLoader,
  UserModeService,
} from '@pwa/core';
import { ToastService } from '@pwa/shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([authTenantInterceptor])),
    { provide: APP_ENV, useValue: environment },
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['es-CO', 'en'],
        defaultLang: 'es-CO',
        fallbackLang: 'es-CO',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      }),
      loader: TranslocoHttpLoader,
    }),
    // Inicializador del entorno (debe ir primero)
    APP_ENV_INITIALIZER,
    {
      provide: HTTP_ERROR_NOTIFIER,
      deps: [ToastService],
      useFactory: (toastService: ToastService) => (appError: AppError) => {
        toastService.error(appError.userMessage);
      },
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TenantResolutionService, TenantConfigService],
      useFactory:
        (resolver: TenantResolutionService, svc: TenantConfigService) => () => {
          resolver.resolveTenant();
          return svc.load();
        },
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [
        TenantConfigService,
        ThemeService,
        ManifestService,
        LoggerService,
        AuthService,
      ],
      useFactory:
        (
          cfg: TenantConfigService,
          theme: ThemeService,
          manifest: ManifestService,
          logger: LoggerService,
          auth: AuthService
        ) =>
        () => {
          const i18n = inject(TranslocoService);
          const seo = inject(SeoService);
          const platformId = inject(PLATFORM_ID);
          const userMode = inject(UserModeService);
          const c = cfg.config;
          if (c) {
            if (isPlatformBrowser(platformId)) {
              theme.applyTheme(c.theme);
              manifest.setTenantManifest(c);
            }
            seo.apply(c);
            logger.setContext({ tenant: c.tenant.slug });
            auth.init(c.tenant.slug);
            userMode.init(); // Inicializar modo de usuario
            i18n.setActiveLang(c.locale || 'es-CO');
            // Initialize PushService only in the browser to avoid SSR DI issues with SwPush
            if (isPlatformBrowser(platformId)) {
              const push = inject(PushService);
              push.init();
            }
          }
        },
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.enableServiceWorker,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
