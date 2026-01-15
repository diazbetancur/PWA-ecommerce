/**
 * 📦 Shared Module
 * Main barrel export for shared components, layouts, and utilities
 */

// Interfaces
export * from './lib/interfaces';

// Layout Components
export * from './lib/layout';
export * from './lib/layouts/tenant-admin-layout/tenant-admin-layout.component';

// UI Components
export * from './lib/ui';
export * from './lib/ui/button/app-button.component';
export * from './lib/ui/search-input/search-input.component';

// Shared Components
export * from './lib/components';
export * from './lib/components/confirmation-dialog/confirmation-dialog.component';
export * from './lib/components/confirmation-dialog/confirmation-dialog.service';

// PWA Components
export * from './lib/components/ios-install-banner/ios-install-banner.component';

// Tenant Admin Components
export * from './lib/components/tenant-admin-menu/tenant-admin-menu.component';

// Toast Notifications
export * from './lib/services/toast.service';
export * from './lib/ui/toast-container/toast-container.component';

// Utilities
export * from './lib/utils/product-mappers';
