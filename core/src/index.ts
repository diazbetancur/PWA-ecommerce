/**
 * 📦 Core Module
 * Main barrel export for core functionality
 */

// Models
export * from './lib/models';

// Configuration
export * from './lib/config';

// Services
export * from './lib/services';

// PWA Services
export * from './lib/pwa/dynamic-pwa-assets.service';
export * from './lib/pwa/pwa-install.service';

// Logging
export * from './lib/logging/logger.service';

// Push Notifications
export * from './lib/push/push.service';

// Auth (includes guards)
export * from './lib/auth';

// HTTP & Interceptors
export * from './lib/http';
export * from './lib/interceptors/tenant-header.interceptor';

// Pipes
export * from './lib/pipes';

// Providers
export * from './lib/providers/tenant-app-initializer.provider';
export * from './lib/providers/tenant-bootstrap.provider';
export * from './lib/providers/tenant-interceptor.provider';

// Components
export * from './lib/components/api-test-demo/api-test-demo.component';
export * from './lib/components/currency-demo/currency-demo.component';
export * from './lib/components/mode-selector/mode-selector-dialog.component';
export * from './lib/components/tenant-debug/tenant-debug.component';
export * from './lib/components/tenant-not-found/tenant-not-found.component';

// Routes
export * from './lib/routes';

// Errors
export * from './lib/errors/global-error-handler';

// APIs
export * from './lib/api/adapters/http-api.adapter';
export * from './lib/api/adapters/mock-api.adapter';
export * from './lib/api/api-factory.service';
export * from './lib/api/contracts';

// i18n
export * from './lib/i18n/transloco.loader';
