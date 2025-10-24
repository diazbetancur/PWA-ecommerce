import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CatalogService } from './catalog.service';
import type { Category, Product } from './catalog.service';

@Component({
  selector: 'lib-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgOptimizedImage],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  private readonly svc = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // state
  categories = signal<Category[] | null>(null);
  products = signal<Product[] | null>(null);
  total = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);

  // query params as signals
  q = signal('');
  category = signal<string | null>(null);
  page = signal(1);
  pageSize = signal(12);
  sort = signal<'newest' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc'>(
    'newest'
  );

  constructor() {
    // sync from query params
    effect(() => {
      this.route.queryParamMap.subscribe((m) => {
        this.q.set(m.get('q') ?? '');
        this.category.set(m.get('category'));
        this.page.set(Number(m.get('page') || 1));
        this.pageSize.set(Number(m.get('pageSize') || 12));
        const sortParam = m.get('sort') as
          | 'newest'
          | 'priceAsc'
          | 'priceDesc'
          | 'nameAsc'
          | 'nameDesc'
          | null;
        this.sort.set(sortParam || 'newest');
        this.load();
      });
    });

    // load categories once
    this.svc.getCategories().subscribe({
      next: (cats: Category[]) => this.categories.set(cats),
      error: () => this.categories.set([]),
    });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getProducts({
        q: this.q(),
        category: this.category() ?? undefined,
        page: this.page(),
        pageSize: this.pageSize(),
        sort: this.sort(),
      })
      .subscribe({
        next: (res: { items: Product[]; total: number }) => {
          this.products.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : 'Error cargando productos';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
  }

  // UI handlers
  async setCategory(slug: string | null) {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: slug, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  async setSort(value: string) {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: value, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  async setPage(p: number) {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: p },
      queryParamsHandling: 'merge',
    });
  }

  trackById = (_: number, item: Product) => item.id;
}
