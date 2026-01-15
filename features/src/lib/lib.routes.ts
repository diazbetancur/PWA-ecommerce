import { Route } from '@angular/router';
import { Catalog } from './catalog/catalog';
import { CategoriesPageComponent } from './catalog/pages';

export const catalogRoutes: Route[] = [
  { path: '', component: Catalog },
  { path: 'categories', component: CategoriesPageComponent },
];
