import { Injectable, inject } from '@angular/core';
import {
  APP_ENV,
  AppEnv,
  AppEnvironmentName,
  AppLogLevel,
} from '../config/app-env.token';

export type AppEnvironment = AppEnv;

/**
 * Servicio centralizado para acceder a la configuración del entorno
 * Proporciona una API limpia y type-safe para acceder a variables de entorno
 */
@Injectable({
  providedIn: 'root',
})
export class AppEnvService {
  private readonly env: AppEnvironment = (inject(APP_ENV, {
    optional: true,
  }) || {
    environmentName: 'local',
    production: false,
    apiBaseUrl: 'http://localhost:5093',
    publicAssetBaseUrl: '',
    enableServiceWorker: false,
    enableSSR: false,
    logLevel: 'debug',
    featureFlags: {},
    enableConsoleLogging: true,
    publicVapidKey: '',
    categoryImageMaxSizeMb: 1,
    useTenantHeader: true,
  }) as AppEnvironment;

  /**
   * Obtiene toda la configuración del entorno
   */
  get environment(): AppEnvironment {
    return this.env;
  }

  get environmentName(): AppEnvironmentName {
    return this.env.environmentName;
  }

  /**
   * Indica si la aplicación está en modo producción
   */
  get isProduction(): boolean {
    return this.env.production || this.env.environmentName === 'pdn';
  }

  /**
   * Indica si la aplicación está en modo desarrollo
   */
  get isDevelopment(): boolean {
    return !this.isProduction;
  }

  /**
   * Obtiene la URL base del API
   */
  get apiBaseUrl(): string {
    return this.env.apiBaseUrl;
  }

  /**
   * Indica si debe incluir headers de tenant
   */
  get useTenantHeader(): boolean {
    return this.env.useTenantHeader ?? true;
  }

  /**
   * Obtiene la configuración de FCM
   */
  get fcmConfig(): { vapidPublicKey: string } {
    return {
      vapidPublicKey: this.env.publicVapidKey ?? '',
    };
  }

  /** Límite de tamaño de imagen de categoría en MB */
  get categoryImageMaxSizeMb(): number {
    return this.env.categoryImageMaxSizeMb ?? 1;
  }

  /** URL base pública para completar imageUrl de categorías */
  get categoryPublicBaseUrl(): string {
    return this.env.publicAssetBaseUrl ?? '';
  }

  /**
   * Verifica si una feature está habilitada
   * @param featureName - Nombre de la feature
   * @returns boolean
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.env.featureFlags?.[featureName] ?? false;
  }

  /**
   * Obtiene el nivel de logging configurado
   */
  get loggingLevel(): AppLogLevel {
    return this.env.logLevel;
  }

  /**
   * Indica si el logging en consola está habilitado
   */
  get isConsoleLoggingEnabled(): boolean {
    return this.env.enableConsoleLogging ?? this.isDevelopment;
  }

  get isServiceWorkerEnabled(): boolean {
    return this.env.enableServiceWorker;
  }

  get isSsrEnabled(): boolean {
    return this.env.enableSSR;
  }

  /**
   * Obtiene información del entorno para debugging
   */
  getEnvironmentInfo(): {
    environmentName: AppEnvironmentName;
    mode: string;
    baseUrl: string;
    serviceWorker: boolean;
    ssr: boolean;
    logLevel: AppLogLevel;
  } {
    return {
      environmentName: this.environmentName,
      mode: this.isProduction ? 'production' : 'development',
      baseUrl: this.apiBaseUrl,
      serviceWorker: this.isServiceWorkerEnabled,
      ssr: this.isSsrEnabled,
      logLevel: this.loggingLevel,
    };
  }

  /**
   * Valida que la configuración del entorno sea correcta
   * Útil para detectar configuraciones inválidas en tiempo de desarrollo
   */
  validateEnvironment(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const allowedEnvironmentNames: AppEnvironmentName[] = [
      'local',
      'dev',
      'qa',
      'pdn',
    ];

    if (!this.environmentName) {
      errors.push('environmentName is required');
    } else if (!allowedEnvironmentNames.includes(this.environmentName)) {
      errors.push(
        `environmentName must be one of: ${allowedEnvironmentNames.join(', ')}`
      );
    }

    if (!this.apiBaseUrl) {
      errors.push('apiBaseUrl is required');
    } else if (!this.apiBaseUrl.startsWith('http')) {
      errors.push('apiBaseUrl must start with http or https');
    }

    if (
      !this.fcmConfig.vapidPublicKey ||
      this.fcmConfig.vapidPublicKey.includes('REPLACE_WITH')
    ) {
      warnings.push(
        'publicVapidKey is not configured; push notifications remain disabled'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Log de información del entorno al inicializar la app
   */
  logEnvironmentInfo(): void {
    if (this.isConsoleLoggingEnabled) {
      console.info('[APP_ENV]', this.getEnvironmentInfo());
    }
  }
}

/**
 * Token de inyección para usar el servicio de entorno
 * Útil para testing o casos especiales donde se necesite override
 */
export const APP_ENV_SERVICE = AppEnvService;
