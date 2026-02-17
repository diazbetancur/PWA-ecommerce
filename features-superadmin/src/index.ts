/**
 * 📦 Barrel Export - Features Superadmin
 *
 * Exporta todas las funcionalidades del módulo de administración general
 */

// Models
export * from './lib/models/admin-auth.model';
export * from './lib/models/admin-menu.model';
export * from './lib/models/admin-user.model';
export * from './lib/models/role-permissions-map';
export * from './lib/models/tenant.model';

// Config
export * from './lib/config/general-tenant.config';

// Services
export * from './lib/services/admin-menu.service';
export * from './lib/services/admin-roles.service';
export * from './lib/services/admin-user-management.service';
export * from './lib/services/tenant-admin.service';

// Guards
export * from './lib/guards/admin-permission.guard';

// Components
export * from './lib/components/access-denied/access-denied.component';
export * from './lib/components/admin-dashboard/admin-dashboard.component';
export * from './lib/components/admin-shell/admin-shell.component';
export * from './lib/components/admin-user-dialog/admin-user-dialog.component';
export * from './lib/components/admin-user-roles-dialog/admin-user-roles-dialog.component';
export * from './lib/components/tenant-detail-dialog/tenant-detail-dialog.component';
export * from './lib/components/tenant-edit-dialog/tenant-edit-dialog.component';

// Pages
export * from './lib/pages/admin-users/admin-users-list.component';
export * from './lib/pages/roles/roles-list.component';
export * from './lib/pages/roles/create-role-dialog.component';
export * from './lib/pages/roles/edit-role-dialog.component';
export * from './lib/pages/roles/manage-permissions-dialog.component';
export * from './lib/pages/roles/role-detail-dialog.component';
export * from './lib/pages/tenant-create/tenant-create.component';
export * from './lib/pages/tenants-list/tenants-list.component';

// Routes
export * from './lib/admin.routes';
