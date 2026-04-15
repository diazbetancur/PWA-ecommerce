/**
 * 📝 Componente de Formulario de Producto
 *
 * Formulario para crear y editar productos con validaciones.
 * Soporta modo creación y edición.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AppEnvService,
  CreateProductDto,
  InitialStoreStockDto,
  ProductResponse,
  ProductService,
  UpdateProductDto,
} from '@pwa/core';
import {
  AppButtonComponent,
  buildAppSnackBarConfig,
  ConfirmationDialogService,
} from '@pwa/shared';
import { CategorySelectorDialogComponent } from '../../../components/category-selector-dialog/category-selector-dialog.component';
import { CategoryListItem } from '../../../models/category.model';
import { StoreDto } from '../../../models/store.models';
import { StoreAdminService } from '../../../services/store-admin.service';

@Component({
  selector: 'lib-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly snackBar = {
    open: (message: string, action?: string, config?: MatSnackBarConfig) =>
      this.matSnackBar.open(
        message,
        action,
        buildAppSnackBarConfig(message, config)
      ),
  };
  private readonly dialog = inject(MatDialog);
  private readonly storeAdminService = inject(StoreAdminService);
  private readonly appEnv = inject(AppEnvService);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  // Estado
  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly productId = signal<string | null>(null);
  readonly product = signal<ProductResponse | null>(null);
  readonly selectedCategories = signal<CategoryListItem[]>([]);
  readonly selectedMainImageFile = signal<File | null>(null);
  readonly selectedAdditionalImageFiles = signal<File[]>([]);
  readonly selectedVideoFiles = signal<File[]>([]);
  readonly mainImagePreviewUrl = signal<string | null>(null);

  // Stock distribution state
  readonly availableStores = signal<StoreDto[]>([]);
  readonly storeStockDistribution = signal<InitialStoreStockDto[]>([]);
  readonly selectedStoreId = signal<string | null>(null);
  readonly stockAmount = signal<number>(0);
  readonly showStockDistribution = signal<boolean>(false);

  // Formulario
  readonly form: FormGroup;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Producto' : 'Nuevo Producto'
  );

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Crear'
  );

  readonly totalStock = computed(() => this.form.get('stock')?.value || 0);

  readonly totalDistributedStock = computed(() =>
    this.storeStockDistribution().reduce((sum, item) => sum + item.stock, 0)
  );

  readonly remainingStock = computed(
    () => this.totalStock() - this.totalDistributedStock()
  );

  readonly canDistributeMore = computed(() => this.remainingStock() > 0);

  readonly stockDistributionValid = computed(
    () => this.totalDistributedStock() <= this.totalStock()
  );

  readonly existingMainImageUrl = computed(
    () => this.product()?.mainImageUrl || null
  );

  readonly existingImageUrls = computed(() => this.product()?.images || []);

  readonly existingVideoUrls = computed(() => this.product()?.videos || []);

  readonly displayMainImageUrl = computed(
    () => this.mainImagePreviewUrl() || this.existingMainImageUrl()
  );

  readonly maxImageSizeMb = computed(() => this.appEnv.categoryImageMaxSizeMb);

  readonly maxImageSizeBytes = computed(
    () => this.maxImageSizeMb() * 1024 * 1024
  );

  private createdMainImageObjectUrl: string | null = null;

  constructor() {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(200),
        ],
      ],
      sku: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(5000)]],
      shortDescription: ['', [Validators.maxLength(250)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      compareAtPrice: [null, [Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      trackInventory: [false],
      isOnSale: [false],
      isTaxIncluded: [true],
      taxPercentage: [null],
      isActive: [true],
      isFeatured: [false],
      tags: [''],
      brand: ['', [Validators.maxLength(100)]],
      categoryIds: [[] as string[]],
      metaTitle: ['', [Validators.maxLength(200)]],
      metaDescription: ['', [Validators.maxLength(500)]],
    });

    this.setupTaxPercentageValidation();
  }

  ngOnDestroy(): void {
    this.revokeMainImageObjectUrl();
  }

  openCategorySelector(): void {
    const dialogRef = this.dialog.open(CategorySelectorDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
    });

    dialogRef
      .afterClosed()
      .subscribe((category: CategoryListItem | undefined) => {
        if (category) {
          const current = this.selectedCategories();
          if (!current.some((c) => c.id === category.id)) {
            const updated = [...current, category];
            this.selectedCategories.set(updated);
            this.form.patchValue({ categoryIds: updated.map((c) => c.id) });
          }
        }
      });
  }

  removeCategory(categoryId: string): void {
    const updated = this.selectedCategories().filter(
      (c) => c.id !== categoryId
    );
    this.selectedCategories.set(updated);
    this.form.patchValue({ categoryIds: updated.map((c) => c.id) });
  }

  clearCategories(): void {
    this.selectedCategories.set([]);
    this.form.patchValue({ categoryIds: [] });
  }

  ngOnInit(): void {
    // Cargar stores activos
    this.loadStores();

    // Verificar si estamos en modo edición
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.productId.set(id);
      this.isEditMode.set(true);
      this.loadProduct(id);
    }
  }

  private setupTaxPercentageValidation(): void {
    const isTaxIncludedControl = this.form.get('isTaxIncluded');
    const taxPercentageControl = this.form.get('taxPercentage');

    if (!isTaxIncludedControl || !taxPercentageControl) {
      return;
    }

    const applyValidators = (isTaxIncluded: boolean): void => {
      if (isTaxIncluded) {
        taxPercentageControl.clearValidators();
      } else {
        taxPercentageControl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(100),
        ]);
      }

      taxPercentageControl.updateValueAndValidity({ emitEvent: false });
    };

    applyValidators(Boolean(isTaxIncludedControl.value));

    isTaxIncludedControl.valueChanges.subscribe((isTaxIncluded: boolean) => {
      applyValidators(Boolean(isTaxIncluded));

      if (isTaxIncluded) {
        taxPercentageControl.setValue(null, { emitEvent: false });
      }
    });
  }

  private loadProduct(id: string): void {
    this.loading.set(true);

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);

        // Cargar categorías si existen
        if (product.categories && product.categories.length > 0) {
          const categories = product.categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            imageUrl: cat.imageUrl,
            isActive: cat.isActive,
            productCount: 0,
          }));
          this.selectedCategories.set(categories);
        }

        // Cargar distribución de stock por tiendas si existe
        if (product.storeStock && product.storeStock.length > 0) {
          const distribution = product.storeStock.map((item) => ({
            storeId: item.storeId,
            stock: item.stock,
          }));
          this.storeStockDistribution.set(distribution);
          this.showStockDistribution.set(true); // Expandir automáticamente
        }

        this.form.patchValue({
          name: product.name,
          sku: product.sku || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          price: product.price,
          compareAtPrice: product.compareAtPrice || null,
          stock: product.stock,
          trackInventory: product.trackInventory,
          isOnSale: product.isOnSale ?? false,
          isTaxIncluded: product.isTaxIncluded ?? true,
          taxPercentage: product.taxPercentage ?? null,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          tags: product.tags || '',
          brand: product.brand || '',
          categoryIds: product.categories?.map((cat) => cat.id) || [],
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar el producto', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/products']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validar distribución de stock
    if (!this.stockDistributionValid()) {
      this.snackBar.open(
        `La suma del stock distribuido (${this.totalDistributedStock()}) no puede exceder el stock total (${this.totalStock()})`,
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    this.loading.set(true);

    const formValue = {
      ...this.form.value,
      mainImage: this.selectedMainImageFile() || undefined,
      images:
        this.selectedAdditionalImageFiles().length > 0
          ? this.selectedAdditionalImageFiles()
          : undefined,
      videos:
        this.selectedVideoFiles().length > 0
          ? this.selectedVideoFiles()
          : undefined,
      initialStoreStock:
        this.storeStockDistribution().length > 0
          ? this.storeStockDistribution()
          : undefined,
    };

    if (this.isEditMode()) {
      this.updateProduct(formValue);
    } else {
      this.createProduct(formValue);
    }
  }

  private createProduct(data: CreateProductDto): void {
    this.productService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Producto creado exitosamente', 'Cerrar', {
          duration: 2000,
        });
        this.router.navigate(['/tenant-admin/catalog/products']);
      },
      error: (error) => {
        const message = error?.error?.title || 'Error al crear el producto';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private updateProduct(data: UpdateProductDto): void {
    const id = this.productId();
    if (!id) return;

    this.productService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
          duration: 2000,
        });
        this.router.navigate(['/tenant-admin/catalog/products']);
      },
      error: (error) => {
        const message =
          error?.error?.title || 'Error al actualizar el producto';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/tenant-admin/catalog/products']);
  }

  onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.selectedMainImageFile.set(null);
      this.mainImagePreviewUrl.set(null);
      this.revokeMainImageObjectUrl();
      return;
    }

    if (file.size > this.maxImageSizeBytes()) {
      this.confirmDialog.alert(
        'Imagen demasiado grande',
        `La imagen principal supera el límite de ${this.maxImageSizeMb()} MB`
      );
      this.clearMainImage(input);
      return;
    }

    this.selectedMainImageFile.set(file);
    this.revokeMainImageObjectUrl();
    this.createdMainImageObjectUrl = URL.createObjectURL(file);
    this.mainImagePreviewUrl.set(this.createdMainImageObjectUrl);
  }

  onAdditionalImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (!files.length) {
      this.selectedAdditionalImageFiles.set([]);
      return;
    }

    const validFiles = files.filter(
      (file) => file.size <= this.maxImageSizeBytes()
    );
    const rejectedFilesCount = files.length - validFiles.length;

    if (rejectedFilesCount > 0) {
      const message =
        rejectedFilesCount === 1
          ? `Se omitió 1 imagen porque supera el límite de ${this.maxImageSizeMb()} MB`
          : `Se omitieron ${rejectedFilesCount} imágenes porque superan el límite de ${this.maxImageSizeMb()} MB`;
      this.confirmDialog.alert('Imágenes demasiado grandes', message);
    }

    if (!validFiles.length) {
      input.value = '';
    }

    this.selectedAdditionalImageFiles.set(validFiles);
  }

  onVideosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.selectedVideoFiles.set(files);
  }

  clearMainImage(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.selectedMainImageFile.set(null);
    this.mainImagePreviewUrl.set(null);
    this.revokeMainImageObjectUrl();
  }

  clearAdditionalImages(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.selectedAdditionalImageFiles.set([]);
  }

  clearVideos(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.selectedVideoFiles.set([]);
  }

  // Helpers para errores en template
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `El valor mínimo es ${errors['min'].min}`;
    if (errors['max']) return `El valor máximo es ${errors['max'].max}`;
    if (errors['email']) return 'Email inválido';

    return 'Campo inválido';
  }

  // Expose Math for template
  Math = Math;

  // ==================== STOCK DISTRIBUTION ====================

  private loadStores(): void {
    this.storeAdminService.getStores({ includeInactive: false }).subscribe({
      next: (stores) => {
        this.availableStores.set(stores);
      },
      error: () => {
        this.availableStores.set([]);
      },
    });
  }

  toggleStockDistribution(): void {
    this.showStockDistribution.update((show) => !show);
  }

  onStoreSelected(storeId: string): void {
    this.selectedStoreId.set(storeId);
  }

  addStoreStock(): void {
    const storeId = this.selectedStoreId();
    const amount = this.stockAmount();

    if (!storeId) {
      this.snackBar.open('Selecciona una sucursal', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    if (amount <= 0) {
      this.snackBar.open('La cantidad debe ser mayor a 0', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    const currentDistribution = this.storeStockDistribution();

    // Verificar si la tienda ya existe
    const existingIndex = currentDistribution.findIndex(
      (item) => item.storeId === storeId
    );

    if (existingIndex >= 0) {
      // Actualizar cantidad existente
      const updated = [...currentDistribution];
      updated[existingIndex] = { storeId, stock: amount };
      this.storeStockDistribution.set(updated);
    } else {
      // Agregar nueva distribución
      const totalAfterAdd = this.totalDistributedStock() + amount;

      if (totalAfterAdd > this.totalStock()) {
        const maxAllowed = this.remainingStock();
        this.snackBar.open(
          `No puedes asignar ${amount} unidades. Máximo disponible: ${maxAllowed}`,
          'Cerrar',
          { duration: 4000 }
        );
        return;
      }

      this.storeStockDistribution.set([
        ...currentDistribution,
        { storeId, stock: amount },
      ]);
    }

    // Limpiar selección
    this.selectedStoreId.set(null);
    this.stockAmount.set(0);
  }

  updateStoreStock(storeId: string, newAmount: number): void {
    if (newAmount < 0) return;

    const currentDistribution = this.storeStockDistribution();
    const itemIndex = currentDistribution.findIndex(
      (item) => item.storeId === storeId
    );

    if (itemIndex < 0) return;

    const otherStoresTotal = currentDistribution
      .filter((item) => item.storeId !== storeId)
      .reduce((sum, item) => sum + item.stock, 0);

    const totalAfterUpdate = otherStoresTotal + newAmount;

    if (totalAfterUpdate > this.totalStock()) {
      const maxAllowed = this.totalStock() - otherStoresTotal;
      this.snackBar.open(
        `No puedes asignar ${newAmount} unidades. Máximo: ${maxAllowed}`,
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const updated = [...currentDistribution];
    updated[itemIndex] = { storeId, stock: newAmount };
    this.storeStockDistribution.set(updated);
  }

  removeStoreStock(storeId: string): void {
    const updated = this.storeStockDistribution().filter(
      (item) => item.storeId !== storeId
    );
    this.storeStockDistribution.set(updated);
  }

  getStoreName(storeId: string): string {
    const store = this.availableStores().find((s) => s.id === storeId);
    return store?.name || 'Sucursal desconocida';
  }

  get availableStoresForSelection(): StoreDto[] {
    const distributedStoreIds = this.storeStockDistribution().map(
      (item) => item.storeId
    );
    return this.availableStores().filter(
      (store) => !distributedStoreIds.includes(store.id)
    );
  }

  private revokeMainImageObjectUrl(): void {
    if (this.createdMainImageObjectUrl) {
      URL.revokeObjectURL(this.createdMainImageObjectUrl);
      this.createdMainImageObjectUrl = null;
    }
  }
}
