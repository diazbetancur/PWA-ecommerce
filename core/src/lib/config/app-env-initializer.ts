import { APP_INITIALIZER, Provider } from '@angular/core';
import { AppEnvService } from '../services/app-env.service';

/**
 * Factory function que inicializa el entorno y valida la configuración
 * Se ejecuta durante el bootstrap de la aplicación
 */
export function initializeAppEnvironmentFactory(envService: AppEnvService) {
  return (): Promise<void> => {
    return new Promise((resolve) => {
      envService.logEnvironmentInfo();

      const validation = envService.validateEnvironment();

      if (validation.errors.length > 0) {
        console.error(
          '[APP_ENV] Invalid public configuration',
          validation.errors
        );
      }

      if (
        validation.warnings.length > 0 &&
        envService.isConsoleLoggingEnabled
      ) {
        console.warn('[APP_ENV] Configuration warnings', validation.warnings);
      }

      resolve();
    });
  };
}

/**
 * Provider para inicializar el entorno de la aplicación
 * Añadir esto en los providers de main.ts
 */
export const APP_ENV_INITIALIZER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeAppEnvironmentFactory,
  deps: [AppEnvService],
  multi: true,
};
