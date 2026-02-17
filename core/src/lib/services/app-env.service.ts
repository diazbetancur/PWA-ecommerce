import { Injectable, inject } from '@angular/core';
import { APP_ENV } from '../config/app-env.token';

/**
 * Interfaz que define la estructura de configuración del entorno
 */
export interface AppEnvironment {
  /** Indica si está en modo producción */
  production: boolean;

  /** Indica si debe usar API mock o real */
  mockApi: boolean;

  /** URL base del backend API */
  apiBaseUrl: string;

  /** Habilitar headers de tenant en requests */
  useTenantHeader: boolean;

  /** Configuración de Firebase Cloud Messaging */
  fcm: {
    vapidPublicKey: string;
  };

  /** Configuraciones adicionales opcionales */
  analytics?: {
    enabled: boolean;
    trackingId?: string;
  };

  /** Configuraciones de logging */
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };

  /** Configuraciones de features flags */
  features?: {
    [key: string]: boolean;
  };
}

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
    production: false,
    mockApi: true,
    apiBaseUrl: 'http://localhost:5200',
    useTenantHeader: true,
    fcm: { vapidPublicKey: '' },
  }) as AppEnvironment;

  /**
   * Obtiene toda la configuración del entorno
   */
  get environment(): AppEnvironment {
    return this.env;
  }

  /**
   * Indica si la aplicación está en modo producción
   */
  get isProduction(): boolean {
    return this.env.production;
  }

  /**
   * Indica si la aplicación está en modo desarrollo
   */
  get isDevelopment(): boolean {
    return !this.env.production;
  }

  /**
   * Indica si debe usar API mock (true) o real (false)
   */
  get useMockApi(): boolean {
    return this.env.mockApi;
  }

  /**
   * Indica si debe usar API real (false) o mock (true)
   */
  get useRealApi(): boolean {
    return !this.env.mockApi;
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
    return this.env.useTenantHeader;
  }

  /**
   * Obtiene la configuración de FCM
   */
  get fcmConfig(): { vapidPublicKey: string } {
    return this.env.fcm;
  }

  /**
   * Verifica si una feature está habilitada
   * @param featureName - Nombre de la feature
   * @returns boolean
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.env.features?.[featureName] ?? false;
  }

  /**
   * Obtiene el nivel de logging configurado
   */
  get loggingLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.env.logging?.level ?? 'info';
  }

  /**
   * Indica si el logging en consola está habilitado
   */
  get isConsoleLoggingEnabled(): boolean {
    return this.env.logging?.enableConsole ?? this.isDevelopment;
  }

  /**
   * Obtiene información del entorno para debugging
   */
  getEnvironmentInfo(): {
    mode: string;
    api: string;
    baseUrl: string;
    version: string;
  } {
    return {
      mode: this.isProduction ? 'production' : 'development',
      api: this.useMockApi ? 'mock' : 'real',
      baseUrl: this.apiBaseUrl,
      version: this.getAppVersion(),
    };
  }

  /**
   * Obtiene la versión de la aplicación (desde package.json si está disponible)
   */
  private getAppVersion(): string {
    // En un escenario real, podrías inyectar la versión desde build time
    return '1.0.0';
  }

  /**
   * Valida que la configuración del entorno sea correcta
   * Útil para detectar configuraciones inválidas en tiempo de desarrollo
   */
  validateEnvironment(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar URL del API
    if (!this.apiBaseUrl) {
      errors.push('apiBaseUrl is required');
    } else if (!this.apiBaseUrl.startsWith('http')) {
      errors.push('apiBaseUrl must start with http or https');
    }

    // Validar configuración FCM
    if (
      !this.fcmConfig.vapidPublicKey ||
      this.fcmConfig.vapidPublicKey.includes('REPLACE_WITH')
    ) {
      errors.push('FCM VAPID key needs to be configured');
    }

    // En desarrollo, mostrar warnings
    if (this.isDevelopment && errors.length > 0) {
      // Validation errors present
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log de información del entorno al inicializar la app
   */
  logEnvironmentInfo(): void {
    if (this.isConsoleLoggingEnabled) {
      const info = this.getEnvironmentInfo();

      // Environment info logged (removed for production)

      // Validar configuración
      const validation = this.validateEnvironment();
      if (!validation.isValid) {
      }
    }
  }
}

/**
 * Token de inyección para usar el servicio de entorno
 * Útil para testing o casos especiales donde se necesite override
 */
export const APP_ENV_SERVICE = AppEnvService;
