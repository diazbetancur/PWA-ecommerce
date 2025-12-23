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
  template: `
    <h2 mat-dialog-title>Seleccionar Categoría</h2>

    <mat-dialog-content>
      <!-- Búsqueda -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar categoría</mat-label>
        <input
          matInput
          [formControl]="searchControl"
          placeholder="Escribe para buscar..."
          (keydown.enter)="$event.preventDefault()"
        />
        <mat-icon matPrefix>search</mat-icon>
        @if (searchControl.value) {
        <button matSuffix mat-icon-button (click)="searchControl.setValue('')">
          <mat-icon>close</mat-icon>
        </button>
        }
      </mat-form-field>

      <!-- Lista de categorías con scroll infinito -->
      <div class="categories-list-container" #scrollContainer>
        @if (loading() && categories().length === 0) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando categorías...</p>
        </div>
        } @else if (categories().length > 0) {
        <mat-selection-list [multiple]="false" class="categories-list">
          @for (category of categories(); track category.id) {
          <mat-list-option
            [value]="category"
            (click)="selectCategory(category)"
            class="category-option"
          >
            <div class="category-item">
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
              </div>
              @if (!category.isActive) {
              <span class="inactive-badge">Inactiva</span>
              }
            </div>
          </mat-list-option>
          }
        </mat-selection-list>

        <!-- Loading más items -->
        @if (loadingMore()) {
        <div class="loading-more">
          <mat-spinner diameter="30"></mat-spinner>
          <p>Cargando más...</p>
        </div>
        } } @else {
        <div class="empty-state">
          <mat-icon>category</mat-icon>
          <p>No se encontraron categorías</p>
          @if (searchControl.value) {
          <button mat-button (click)="searchControl.setValue('')">
            Limpiar búsqueda
          </button>
          }
        </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 500px;
        max-width: 600px;
        min-height: 400px;
        max-height: 70vh;
        padding: 1rem;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .search-field {
        width: 100%;
        margin-bottom: 1rem;
      }

      .categories-list-container {
        flex: 1;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background: #fff;
      }

      .categories-list {
        padding: 0;
      }

      .category-option {
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.2s;
      }

      .category-option:hover {
        background: #f5f5f5;
      }

      .category-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.5rem 0;
      }

      .category-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .category-name {
        font-weight: 500;
        color: #000;
      }

      .category-description {
        font-size: 0.85rem;
        color: rgba(0, 0, 0, 0.6);
      }

      .inactive-badge {
        padding: 4px 8px;
        background: #f8d7da;
        color: #721c24;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .loading-state,
      .loading-more,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        gap: 1rem;
        text-align: center;
      }

      .empty-state mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: rgba(0, 0, 0, 0.3);
      }

      .empty-state p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
      }

      .loading-more {
        padding: 1rem;
      }

      .loading-more p {
        margin: 0;
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
      }

      /* Scrollbar */
      .categories-list-container::-webkit-scrollbar {
        width: 8px;
      }

      .categories-list-container::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      .categories-list-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .categories-list-container::-webkit-scrollbar-thumb:hover {
        background: #555;
      }

      @media (max-width: 768px) {
        mat-dialog-content {
          min-width: 100%;
          max-width: 100%;
        }
      }
    `,
  ],
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
          console.error('Error loading categories:', error);
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
          console.error('Error loading more categories:', error);
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
