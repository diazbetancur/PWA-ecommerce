import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@pwa/shared';
import {
  ProductStoreStockDto,
  UpdateProductStoreStockRequest,
} from '../../../models/store.models';
import { StoreAdminService } from '../../../services/store-admin.service';

/**
 * 📦 Componente de Stock de Producto por Tiendas
 *
 * Muestra y permite editar el stock de un producto específico
 * en todas las tiendas del tenant.
 */
@Component({
  selector: 'lib-product-stock-by-stores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-stock-by-stores.component.html',
  styleUrl: './product-stock-by-stores.component.scss',
})
export class ProductStockByStoresComponent implements OnInit {
  private readonly storeService = inject(StoreAdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  // Input para cuando se usa como componente embebido
  productId = input<string>();

  // Signals
  private _productIdSignal = signal<string | null>(null);
  productName = signal<string>('');
  productSku = signal<string>('');
  productTotalStock = signal<number>(0);
  stockData = signal<ProductStoreStockDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  editingStoreId = signal<string | null>(null);
  editingStock = signal<number>(0);
  savingStock = signal(false);

  // Computed
  hasStock = computed(() => this.stockData().length > 0);
  currentProductId = computed(
    () => this.productId() || this._productIdSignal()
  );
  totalAssignedStock = computed(() =>
    this.stockData().reduce((sum, item) => sum + item.stock, 0)
  );
  totalReserved = computed(() =>
    this.stockData().reduce((sum, item) => sum + item.reservedStock, 0)
  );
  totalAvailable = computed(() =>
    this.stockData().reduce((sum, item) => sum + item.availableStock, 0)
  );
  remainingStock = computed(
    () => this.productTotalStock() - this.totalAssignedStock()
  );
  canAssignMore = computed(() => this.remainingStock() > 0);

  ngOnInit(): void {
    // Si no viene productId como input, tomar de la ruta
    if (!this.productId()) {
      const id = this.route.snapshot.paramMap.get('productId');
      if (id) {
        this._productIdSignal.set(id);
      }
    }

    const prodId = this.currentProductId();
    if (prodId) {
      this.loadStock(prodId);
    } else {
      this.error.set('No se especificó un producto');
      this.loading.set(false);
    }
  }

  /**
   * Cargar stock del producto en todas las tiendas
   */
  loadStock(productId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.storeService
      .getProductStockByStores(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.productName.set(response.productName);
          this.productSku.set(response.productSku || '');
          this.productTotalStock.set(response.productTotalStock);
          this.stockData.set(response.stores);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar stock:', err);
          this.error.set('Error al cargar el stock por tiendas');
          this.loading.set(false);
        },
      });
  }

  /**
   * Iniciar edición de stock
   */
  onEditStock(item: ProductStoreStockDto): void {
    this.editingStoreId.set(item.storeId);
    this.editingStock.set(item.stock);
  }

  /**
   * Cancelar edición
   */
  onCancelEdit(): void {
    this.editingStoreId.set(null);
    this.editingStock.set(0);
  }

  /**
   * Guardar cambios de stock
   */
  onSaveStock(item: ProductStoreStockDto): void {
    const productId = this.currentProductId();
    if (!productId) return;

    const newStock = this.editingStock();

    // Validación: stock no negativo
    if (newStock < 0) {
      this.toastService.warning('El stock no puede ser negativo');
      return;
    }

    // Validación: calcular el total que se asignaría con este cambio
    const otherStoresStock = this.stockData()
      .filter((s) => s.storeId !== item.storeId)
      .reduce((sum, s) => sum + s.stock, 0);

    const totalAfterChange = otherStoresStock + newStock;
    const productMax = this.productTotalStock();

    // Validación: no exceder el stock total del producto
    if (totalAfterChange > productMax) {
      const maxAllowed = productMax - otherStoresStock;
      this.toastService.error(
        `No puedes asignar más de ${maxAllowed} unidades. ` +
          `Stock total del producto: ${productMax}. ` +
          `Ya asignado en otras sucursales: ${otherStoresStock}.`
      );
      return;
    }

    this.savingStock.set(true);

    const request: UpdateProductStoreStockRequest = {
      storeId: item.storeId,
      stock: newStock,
    };

    this.storeService
      .updateProductStoreStock(productId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editingStoreId.set(null);
          this.savingStock.set(false);
          this.toastService.success('Stock actualizado exitosamente');
          this.loadStock(productId); // Recargar datos
        },
        error: (err) => {
          console.error('Error al actualizar stock:', err);
          const message = err.error?.detail || 'Error al actualizar el stock';
          this.toastService.error(message);
          this.savingStock.set(false);
        },
      });
  }

  /**
   * Verificar si una tienda está en edición
   */
  isEditing(storeId: string): boolean {
    return this.editingStoreId() === storeId;
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Obtener clase CSS según nivel de stock
   */
  getStockClass(availableStock: number): string {
    if (availableStock === 0) return 'stock-empty';
    if (availableStock < 10) return 'stock-low';
    if (availableStock < 50) return 'stock-medium';
    return 'stock-good';
  }

  /**
   * Volver a la lista
   */
  onGoBack(): void {
    this.router.navigate(['/tenant-admin/settings/stores']);
  }

  // Expose Math for template
  Math = Math;
}
