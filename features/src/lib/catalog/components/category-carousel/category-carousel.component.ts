import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryListItem, CategoryService } from '@pwa/features-admin';

@Component({
  selector: 'lib-category-carousel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './category-carousel.component.html',
  styleUrl: './category-carousel.component.scss',
})
export class CategoryCarouselComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private readonly categoryService = inject(CategoryService);

  // Signals
  categories = signal<CategoryListItem[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  selectedCategoryId = signal<string | null>(null);

  // Pagination
  private currentPage = 1;
  private readonly pageSize = 20;
  private hasMorePages = true;

  // Output event
  categorySelected = output<string | null>();

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    if (this.loading()) return;

    this.loading.set(true);

    this.categoryService
      .list({
        page: this.currentPage,
        pageSize: this.pageSize,
        isActive: true, // Solo categorías activas
      })
      .subscribe({
        next: (response) => {
          this.categories.set(response.items);
          this.hasMorePages = response.page < response.totalPages;
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
        },
      });
  }

  loadMore(): void {
    if (!this.hasMorePages || this.loadingMore()) return;

    this.loadingMore.set(true);
    this.currentPage++;

    this.categoryService
      .list({
        page: this.currentPage,
        pageSize: this.pageSize,
        isActive: true,
      })
      .subscribe({
        next: (response) => {
          const current = this.categories();
          this.categories.set([...current, ...response.items]);
          this.hasMorePages = response.page < response.totalPages;
          this.loadingMore.set(false);
        },
        error: (error: unknown) => {
          this.loadingMore.set(false);
          this.currentPage--;
        },
      });
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
    this.categorySelected.emit(categoryId);
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLDivElement;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    // Load more when near end (100px threshold)
    if (scrollLeft + clientWidth >= scrollWidth - 100) {
      this.loadMore();
    }
  }

  scrollLeft(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  }

  scrollRight(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  }
}
