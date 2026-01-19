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
import { Router } from '@angular/router';
import { ToastService } from '@pwa/shared';
import {
  MigrateLegacyStockRequest,
  StoreDto,
} from '../../../models/store.models';
import { StoreAdminService } from '../../../services/store-admin.service';

/**
 * 🔄 Componente de Migración de Stock Legacy
 *
 * Permite migrar el stock existente en Product.Stock
 * a una tienda específica del nuevo sistema multi-ubicación.
 */
@Component({
  selector: 'lib-migrate-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './migrate-stock.component.html',
  styleUrl: './migrate-stock.component.scss',
})
export class MigrateStockComponent implements OnInit {
  private readonly storeService = inject(StoreAdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  // Signals
  stores = signal<StoreDto[]>([]);
  selectedStoreId = signal<string | null>(null);
  loading = signal(true);
  migrating = signal(false);
  error = signal<string | null>(null);
  migrationResult = signal<{
    success: boolean;
    migratedCount: number;
    message: string;
  } | null>(null);

  // Computed
  hasStores = computed(() => this.stores().length > 0);
  canMigrate = computed(
    () => this.selectedStoreId() !== null && !this.migrating()
  );
  defaultStore = computed(() => this.stores().find((s) => s.isDefault));

  ngOnInit(): void {
    this.loadStores();
  }

  /**
   * Cargar tiendas disponibles
   */
  loadStores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storeService
      .getStores({ includeInactive: false })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stores) => {
          this.stores.set(stores);
          this.loading.set(false);

          // Auto-seleccionar la tienda default si existe
          const defaultStore = stores.find((s) => s.isDefault);
          if (defaultStore) {
            this.selectedStoreId.set(defaultStore.id);
          }
        },
        error: (err) => {
          console.error('Error al cargar tiendas:', err);
          this.error.set('Error al cargar las tiendas');
          this.loading.set(false);
        },
      });
  }

  /**
   * Seleccionar tienda
   */
  onSelectStore(storeId: string): void {
    this.selectedStoreId.set(storeId);
  }

  /**
   * Ejecutar migración
   */
  onMigrate(): void {
    const storeId = this.selectedStoreId();
    if (!storeId) {
      this.toastService.warning('Debes seleccionar una tienda destino');
      return;
    }

    const storeName = this.stores().find((s) => s.id === storeId)?.name;
    const confirmation = confirm(
      `¿Estás seguro de migrar el stock legacy a "${storeName}"?\n\n` +
        `Esta operación:\n` +
        `• Copiará el stock de todos los productos con stock > 0\n` +
        `• Creará registros en ProductStoreStock\n` +
        `• NO modificará Product.Stock (mantiene compatibilidad)\n\n` +
        `Productos que ya tengan stock en esta tienda NO serán afectados.`
    );

    if (!confirmation) return;

    this.migrating.set(true);
    this.error.set(null);
    this.migrationResult.set(null);

    const request: MigrateLegacyStockRequest = {
      defaultStoreId: storeId,
    };

    this.storeService
      .migrateLegacyStock(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.migrationResult.set({
            success: true,
            migratedCount: result.migratedProductsCount,
            message: result.message,
          });
          this.migrating.set(false);
        },
        error: (err) => {
          console.error('Error en migración:', err);
          const errorMessage =
            err.error?.detail || 'Error al ejecutar la migración de stock';
          this.error.set(errorMessage);
          this.migrationResult.set({
            success: false,
            migratedCount: 0,
            message: errorMessage,
          });
          this.migrating.set(false);
        },
      });
  }

  /**
   * Volver a la lista de tiendas
   */
  onGoBack(): void {
    this.router.navigate(['/tenant-admin/settings/stores']);
  }

  /**
   * Reiniciar para nueva migración
   */
  onReset(): void {
    this.migrationResult.set(null);
    this.error.set(null);
    this.loadStores();
  }
}
