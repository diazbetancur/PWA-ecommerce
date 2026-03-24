import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    redirectTo: 'catalog',
    pathMatch: 'full',
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
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories-page.component').then(
        (m) => m.CategoriesPageComponent
      ),
    title: 'Categorías',
  },
  {
    path: 'categories/:categorySlug/products',
    loadComponent: () =>
      import('./pages/category-products/category-products-page.component').then(
        (m) => m.CategoryProductsPageComponent
      ),
    title: 'Productos por categoría',
  },
  {
    path: 'categories/:categorySlug/products/:productSlug',
    loadComponent: () =>
      import(
        './pages/category-product-detail/category-product-detail-page.component'
      ).then((m) => m.CategoryProductDetailPageComponent),
    title: 'Detalle de producto',
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
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart-page.component').then(
        (m) => m.CartPageComponent
      ),
    title: 'Carrito de compras',
  },
];

// Ruta principal para ser importada en app.routes.ts
export const CATALOG_FEATURE_ROUTES: Routes = [
  {
    path: 'catalog',
    loadChildren: () => import('./catalog.routes').then((m) => m.catalogRoutes),
  },
];
