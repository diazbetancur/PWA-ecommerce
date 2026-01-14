import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerCarouselComponent } from './components/banner-carousel/banner-carousel.component';
import { CategoryCarouselComponent } from './components/category-carousel/category-carousel.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { PublicHeaderComponent } from './components/public-header/public-header.component';

@Component({
  selector: 'lib-catalog',
  standalone: true,
  imports: [
    CommonModule,
    PublicHeaderComponent,
    BannerCarouselComponent,
    CategoryCarouselComponent,
    ProductGridComponent,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Query params como signals
  searchQuery = signal('');
  selectedCategoryId = signal<string | null>(null);

  constructor() {
    // Sincronizar con query params
    effect(() => {
      this.route.queryParamMap.subscribe((params) => {
        this.searchQuery.set(params.get('q') || '');
        this.selectedCategoryId.set(params.get('categoryId'));
      });
    });
  }

  onCategorySelected(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoryId: categoryId || null },
      queryParamsHandling: 'merge',
    });
  }
}
