import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home-page.component').then(
        (m) => m.HomePageComponent
      ),
    title: 'Inicio',
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./pages/catalog/catalog-page.component').then(
        (m) => m.CatalogPageComponent
      ),
    title: 'Catálogo de Productos',
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details.component').then(
        (m) => m.ProductDetailsComponent
      ),
    title: 'Detalle del Producto',
    data: { prerender: false },
  },
  {
    path: 'products/:slug',
    loadComponent: () =>
      import('./pages/product-details/product-details.component').then(
        (m) => m.ProductDetailsComponent
      ),
    title: 'Detalle del Producto',
    data: { prerender: false },
  },
];

// Ruta principal para ser importada en app.routes.ts
export const CATALOG_FEATURE_ROUTES: Routes = [
  {
    path: 'catalog',
    loadChildren: () => import('./catalog.routes').then((m) => m.catalogRoutes),
  },
];
