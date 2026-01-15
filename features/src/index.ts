/**
 * 📦 Features Module
 * Main barrel export for all feature modules
 */

// Catalog Feature
export * from './lib/catalog';

// Routes
export { catalogRoutes, loyaltyRoutes } from './lib/lib.routes';

// Loyalty Feature
export * from './lib/loyalty/models/loyalty.models';
export * from './lib/loyalty/services/loyalty.service';
export * from './lib/loyalty/pages/index';
export * from './lib/loyalty/components/index';
