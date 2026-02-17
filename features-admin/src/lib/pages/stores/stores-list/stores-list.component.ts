import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@pwa/shared';
import { StoreDto } from '../../../models/store.models';
import { StoreAdminService } from '../../../services/store-admin.service';

/**
 * 🏪 Componente de Lista de Tiendas
 *
 * Muestra todas las tiendas del tenant con opciones para:
 * - Crear nueva tienda
 * - Editar tienda existente
 * - Establecer tienda predeterminada
 * - Eliminar tienda
 * - Filtrar tiendas activas/inactivas
 */
@Component({
  selector: 'lib-stores-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './stores-list.component.html',
  styleUrl: './stores-list.component.scss',
})
export class StoresListComponent implements OnInit {
  private readonly storeService = inject(StoreAdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  // Signals
  stores = signal<StoreDto[]>([]);
  loading = signal(true);
  includeInactive = signal(false);
  error = signal<string | null>(null);

  // Computed
  hasStores = computed(() => this.stores().length > 0);
  activeStoresCount = computed(
    () => this.stores().filter((s) => s.isActive).length
  );
  defaultStore = computed(() => this.stores().find((s) => s.isDefault));

  ngOnInit(): void {
    this.loadStores();
  }

  /**
   * Cargar lista de tiendas
   */
  loadStores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storeService
      .getStores({ includeInactive: this.includeInactive() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stores) => {
          this.stores.set(stores);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar las tiendas');
          this.loading.set(false);
        },
      });
  }

  /**
   * Cambiar filtro de tiendas inactivas
   */
  onToggleInactive(): void {
    this.includeInactive.update((v) => !v);
    this.loadStores();
  }

  /**
   * Navegar a crear nueva tienda
   */
  onCreateStore(): void {
    this.router.navigate(['/tenant-admin/settings/stores/new']);
  }

  /**
   * Navegar a migración de stock
   */
  onMigrateStock(): void {
    this.router.navigate(['/tenant-admin/settings/stores/migrate-stock']);
  }

  /**
   * Navegar a editar tienda
   */
  onEditStore(storeId: string): void {
    this.router.navigate(['/tenant-admin/settings/stores', storeId, 'edit']);
  }

  /**
   * Navegar a stock de tienda
   */
  onViewStock(storeId: string): void {
    this.router.navigate(['/tenant-admin/settings/stores', storeId, 'stock']);
  }

  /**
   * Establecer tienda como predeterminada
   */
  onSetDefault(store: StoreDto): void {
    if (store.isDefault) return;

    if (!confirm(`¿Establecer "${store.name}" como tienda predeterminada?`)) {
      return;
    }

    this.storeService
      .setDefaultStore(store.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(
            'Tienda predeterminada establecida exitosamente'
          );
          this.loadStores();
        },
        error: (err) => {
          this.toastService.error(
            err.error?.detail || 'Error al establecer tienda predeterminada'
          );
        },
      });
  }

  /**
   * Eliminar tienda
   */
  onDeleteStore(store: StoreDto): void {
    if (store.isDefault) {
      this.toastService.warning(
        'No se puede eliminar la tienda predeterminada'
      );
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de eliminar "${store.name}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    this.storeService
      .deleteStore(store.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Tienda eliminada exitosamente');
          this.loadStores();
        },
        error: (err) => {
          const message =
            err.error?.detail ||
            'Error al eliminar la tienda. Puede tener stock u órdenes asociadas.';
          this.toastService.error(message);
        },
      });
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
