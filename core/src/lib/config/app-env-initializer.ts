import { APP_INITIALIZER, Provider } from '@angular/core';
import { AppEnvService } from '../services/app-env.service';

/**
 * Factory function que inicializa el entorno y valida la configuración
 * Se ejecuta durante el bootstrap de la aplicación
 */
export function initializeAppEnvironmentFactory(envService: AppEnvService) {
  return (): Promise<void> => {
    return new Promise((resolve) => {
      // Log de información del entorno
      envService.logEnvironmentInfo();

      // Validar configuración (errors se loggean automáticamente)
      envService.validateEnvironment();

      // En desarrollo, mostrar información adicional
      if (envService.isDevelopment) {
        console.group('🔧 Development Mode Configuration');
        console.groupEnd();
      }

      // Resolver inmediatamente (configuración síncrona)
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
