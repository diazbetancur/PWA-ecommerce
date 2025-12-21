/**
 * 📦 Barrel Export - Features Superadmin
 *
 * Exporta todas las funcionalidades del módulo de administración general
 */

// Models
export * from './lib/models/admin-auth.model';
export * from './lib/models/admin-menu.model';
export * from './lib/models/tenant.model';

// Config
export * from './lib/config/general-tenant.config';

// Services
export * from './lib/services/admin-menu.service';
export * from './lib/services/tenant-admin.service';

// Guards
export * from './lib/guards/admin-permission.guard';

// Components
export * from './lib/components/access-denied/access-denied.component';
export * from './lib/components/admin-dashboard/admin-dashboard.component';
export * from './lib/components/admin-shell/admin-shell.component';

// Pages
export * from './lib/pages/tenant-create/tenant-create.component';
export * from './lib/pages/tenants-list/tenants-list.component';

// Routes
export * from './lib/admin.routes';
