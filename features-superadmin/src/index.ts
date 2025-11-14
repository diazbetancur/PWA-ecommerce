/**
 * 📦 Barrel Export - Features Superadmin
 *
 * Exporta todas las funcionalidades del módulo de administración general
 */

// Models
export * from './lib/models/admin-menu.model';
export * from './lib/models/admin-auth.model';

// Config
export * from './lib/config/general-tenant.config';

// Services
export * from './lib/services/admin-menu.service';

// Guards
export * from './lib/guards/admin-permission.guard';

// Components
export * from './lib/components/admin-shell/admin-shell.component';
export * from './lib/components/admin-dashboard/admin-dashboard.component';
export * from './lib/components/access-denied/access-denied.component';

// Routes
export * from './lib/admin.routes';
