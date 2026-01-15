import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StoreCategoryDto } from '../../models/storefront-api.models';
import { StorefrontApiService } from '../../services/storefront-api.service';

@Component({
  selector: 'lib-categories-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
})
export class CategoriesPageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly router = inject(Router);

  readonly categories = signal<StoreCategoryDto[]>([]);
  readonly displayedCategories = signal<StoreCategoryDto[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly searchControl = new FormControl('');

  private readonly ITEMS_PER_PAGE = 12;
  private currentIndex = 0;

  readonly filteredCategories = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    if (!search) return this.categories();

    return this.categories().filter(
      (cat) =>
        cat.name.toLowerCase().includes(search) ||
        (cat.children && cat.children.length > 0)
    );
  });

  readonly hasMore = computed(() => {
    return this.displayedCategories().length < this.filteredCategories().length;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchSubscription();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.storefrontApi.getCategories(false).subscribe({
      next: (categories) => {
        // Aplanar la jerarquía de categorías
        const flatCategories = this.flattenCategories(categories);
        this.categories.set(flatCategories);
        this.currentIndex = 0;
        this.loadMoreCategories();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[CategoriesPage] Error loading categories:', error);
        this.categories.set([]);
        this.displayedCategories.set([]);
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

  /**
   * Carga más categorías para el scroll infinito
   */
  private loadMoreCategories(): void {
    const filtered = this.filteredCategories();
    const nextBatch = filtered.slice(
      this.currentIndex,
      this.currentIndex + this.ITEMS_PER_PAGE
    );

    if (nextBatch.length > 0) {
      this.displayedCategories.update((current) => [...current, ...nextBatch]);
      this.currentIndex += nextBatch.length;
    }
  }

  /**
   * Detecta cuando el usuario llega al final de la página
   */
  @HostListener('window:scroll')
  onScroll(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    const threshold = 300; // Pixels antes del final

    if (scrollPosition >= pageHeight - threshold) {
      this.loadingMore.set(true);
      // Simular un pequeño delay para mejor UX
      setTimeout(() => {
        this.loadMoreCategories();
        this.loadingMore.set(false);
      }, 300);
    }
  }

  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        // Resetear el scroll infinito al buscar
        this.currentIndex = 0;
        this.displayedCategories.set([]);
        this.loadMoreCategories();
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  goToCategory(categorySlug: string): void {
    this.router.navigate(['/catalog'], {
      queryParams: { category: categorySlug },
    });
  }

  getDefaultImage(): string {
    return 'assets/images/category-placeholder.svg';
  }
}
