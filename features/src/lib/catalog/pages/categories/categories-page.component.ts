import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Category } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'lib-categories-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
})
export class CategoriesPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly searchControl = new FormControl('');

  readonly filteredCategories = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    if (!search) return this.categories();

    return this.categories().filter(
      (cat) =>
        cat.name.toLowerCase().includes(search) ||
        cat.description?.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchSubscription();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.catalogService.getCategories().subscribe({
      next: (response) => {
        const categoriesWithSlug: Category[] = (response.data || []).map(
          (category: Category) => ({
            ...category,
            slug: this.generateSlug(category.name),
          })
        );
        this.categories.set(categoriesWithSlug);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading.set(false);
      },
    });
  }

  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        // El filtrado se hace automáticamente con computed
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  getDefaultImage(): string {
    return 'assets/images/category-placeholder.svg';
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
