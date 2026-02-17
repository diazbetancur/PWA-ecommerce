import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CategoryListItem,
  CategoryListResponse,
} from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'lib-category-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-selector-dialog.component.html',
  styleUrl: './category-selector-dialog.component.scss',
})
export class CategorySelectorDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<CategorySelectorDialogComponent>
  );
  private readonly categoryService = inject(CategoryService);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  readonly categories = signal<CategoryListItem[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly searchControl = new FormControl('');

  private currentPage = 1;
  private readonly pageSize = 20;
  private hasMorePages = true;

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearch();
    this.setupInfiniteScroll();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.resetAndLoad();
      });
  }

  private setupInfiniteScroll(): void {
    // Detectar cuando el usuario llega al final del scroll
    setTimeout(() => {
      const container = this.scrollContainer?.nativeElement;
      if (!container) return;

      container.addEventListener('scroll', () => {
        const threshold = 100;
        const position = container.scrollTop + container.clientHeight;
        const height = container.scrollHeight;

        if (
          position > height - threshold &&
          !this.loading() &&
          !this.loadingMore() &&
          this.hasMorePages
        ) {
          this.loadMore();
        }
      });
    }, 100);
  }

  private resetAndLoad(): void {
    this.currentPage = 1;
    this.hasMorePages = true;
    this.categories.set([]);
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);

    this.categoryService
      .list({
        page: this.currentPage,
        pageSize: this.pageSize,
        search: this.searchControl.value || undefined,
        isActive: true, // Solo mostrar categorías activas
      })
      .subscribe({
        next: (response: CategoryListResponse) => {
          this.categories.set(response.items);
          this.hasMorePages = response.page < response.totalPages;
          this.loading.set(false);
        },
        error: (error: any) => {
          this.loading.set(false);
        },
      });
  }

  private loadMore(): void {
    if (!this.hasMorePages || this.loadingMore()) return;

    this.loadingMore.set(true);
    this.currentPage++;

    this.categoryService
      .list({
        page: this.currentPage,
        pageSize: this.pageSize,
        search: this.searchControl.value || undefined,
        isActive: true,
      })
      .subscribe({
        next: (response: CategoryListResponse) => {
          const current = this.categories();
          this.categories.set([...current, ...response.items]);
          this.hasMorePages = response.page < response.totalPages;
          this.loadingMore.set(false);
        },
        error: (error: any) => {
          this.loadingMore.set(false);
          this.currentPage--; // Revertir incremento en caso de error
        },
      });
  }

  selectCategory(category: CategoryListItem): void {
    this.dialogRef.close(category);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
