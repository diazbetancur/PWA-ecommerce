import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StoreCategoryDto } from '../../models/storefront-api.models';
import { StorefrontApiService } from '../../services/storefront-api.service';

@Component({
  selector: 'lib-categories-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
})
export class CategoriesPageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly router = inject(Router);

  readonly categories = signal<StoreCategoryDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.storefrontApi.getCategories(false).subscribe({
      next: (categories) => {
        const flatCategories = this.flattenCategories(categories);
        this.categories.set(flatCategories);
        this.loading.set(false);
      },
      error: () => {
        this.categories.set([]);
        this.loading.set(false);
      },
    });
  }

  /**
   * Aplana la jerarquía de categorías para mostrar todas en una lista
   */
  private flattenCategories(
    categories: StoreCategoryDto[]
  ): StoreCategoryDto[] {
    const flattened: StoreCategoryDto[] = [];

    const flatten = (cats: StoreCategoryDto[]) => {
      for (const cat of cats) {
        flattened.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      }
    };

    flatten(categories);
    return flattened;
  }

  goToCategory(categorySlug: string): void {
    this.router.navigate(['/catalog'], {
      queryParams: { category: categorySlug },
    });
  }
}
