import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '@pwa/core';
import {
  ConfirmationDialogService,
  extractApiErrorMessage,
  ToastService,
} from '@pwa/shared';
import {
  CreateLoyaltyRewardRequest,
  LoyaltyRewardDto,
  REWARD_TYPE_LABELS,
  RewardType,
  SingleProductSelectionRule,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';
import {
  RewardProductSelectionResult,
  RewardProductSelectorDialogComponent,
} from '../reward-product-selector-dialog/reward-product-selector-dialog.component';

@Component({
  selector: 'lib-reward-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reward-form.component.html',
  styleUrl: './reward-form.component.scss',
})
export class RewardFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly productService = inject(ProductService);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  isLoading = signal(false);
  isSaving = signal(false);
  submitFeedback = signal<string | null>(null);
  isEditMode = signal(false);
  rewardId = signal<string | null>(null);
  reward = signal<LoyaltyRewardDto | null>(null);
  selectedProducts = signal<Array<{ productId: string; productName: string }>>(
    []
  );
  selectedImageFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  readonly minAvailableDateTime = signal(
    this.toDateTimeLocal(new Date().toISOString())
  );
  readonly maxImageSizeMb = computed(() => 1);
  readonly maxImageSizeBytes = computed(() => 1024 * 1024);
  readonly currentImageUrl = computed(() => this.reward()?.imageUrl || null);
  readonly hasImagePreview = computed(
    () => !!this.imagePreviewUrl() || !!this.currentImageUrl()
  );
  readonly displayPreviewUrl = computed(
    () => this.imagePreviewUrl() || this.currentImageUrl()
  );

  private createdObjectUrl: string | null = null;

  readonly rewardTypeOptions = [
    [RewardType.PRODUCT, REWARD_TYPE_LABELS[RewardType.PRODUCT]],
    [
      RewardType.DISCOUNT_PERCENTAGE,
      REWARD_TYPE_LABELS[RewardType.DISCOUNT_PERCENTAGE],
    ],
  ] as const;

  readonly singleProductSelectionRuleOptions = [
    [SingleProductSelectionRule.MOST_EXPENSIVE, 'Más costoso'],
    [SingleProductSelectionRule.CHEAPEST, 'Más económico'],
  ] as const;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Premio' : 'Crear Premio'
  );

  readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Guardar Cambios' : 'Crear Premio'
  );

  readonly form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
      ],
    ],
    rewardType: ['DISCOUNT_PERCENTAGE', [Validators.required]],
    pointsCost: [100, [Validators.required, Validators.min(1)]],
    discountValue: [null as number | null],
    productIds: this.fb.control<string[] | null>(null),
    appliesToAllEligibleProducts: [true],
    singleProductSelectionRule: [null as SingleProductSelectionRule | null],
    couponQuantity: [null as number | null],
    validityDays: [null as number | null],
    availableFrom: [''],
    availableUntil: [''],
    termsAndConditions: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.rewardId.set(id);
      this.loadReward(id);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private loadReward(id: string): void {
    this.isLoading.set(true);
    this.loyaltyAdminService.getRewardById(id).subscribe({
      next: (reward) => {
        this.patchForm(reward);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('No se pudo cargar el premio');
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  private patchForm(reward: LoyaltyRewardDto): void {
    this.reward.set(reward);
    this.form.patchValue({
      name: reward.name,
      description: reward.description,
      rewardType: reward.rewardType,
      pointsCost: reward.pointsCost,
      discountValue: reward.discountValue ?? null,
      productIds: reward.productIds ?? null,
      appliesToAllEligibleProducts: reward.appliesToAllEligibleProducts ?? true,
      singleProductSelectionRule:
        (reward.singleProductSelectionRule as SingleProductSelectionRule) ??
        null,
      couponQuantity: reward.couponQuantity ?? reward.stock ?? null,
      validityDays: reward.validityDays ?? null,
      availableFrom: this.toDateTimeLocal(reward.availableFrom),
      availableUntil: this.toDateTimeLocal(reward.availableUntil),
      termsAndConditions: reward.termsAndConditions ?? '',
    });

    let selectedIds: string[] = [];
    if (reward.productIds && reward.productIds.length > 0) {
      selectedIds = reward.productIds;
    } else if (reward.productId) {
      selectedIds = [reward.productId];
    }

    this.setSelectedProducts(
      selectedIds,
      reward.productName
        ? [
            {
              productId: reward.productId || selectedIds[0],
              productName: reward.productName,
            },
          ]
        : []
    );

    if (!reward.productName && selectedIds.length > 0) {
      this.loadProductNamesByIds(selectedIds);
    }
  }

  isProductReward(): boolean {
    return this.form.value.rewardType === 'PRODUCT';
  }

  isDiscountReward(): boolean {
    return this.form.value.rewardType === RewardType.DISCOUNT_PERCENTAGE;
  }

  requiresProductSelection(): boolean {
    return this.isProductReward() || this.isDiscountReward();
  }

  requiresSingleProductSelection(): boolean {
    return this.isProductReward();
  }

  onRewardTypeChange(): void {
    if (this.isProductReward()) {
      const currentSelection = this.selectedProducts();
      if (currentSelection.length > 1) {
        this.setSelectedProducts(
          [currentSelection[0].productId],
          [currentSelection[0]]
        );
      }
      this.form.patchValue({
        appliesToAllEligibleProducts: false,
        singleProductSelectionRule: null,
      });
      return;
    }

    this.form.patchValue({
      appliesToAllEligibleProducts:
        this.form.value.appliesToAllEligibleProducts ?? true,
    });
  }

  onAppliesScopeChange(): void {
    if (this.form.value.appliesToAllEligibleProducts) {
      this.form.patchValue({ singleProductSelectionRule: null });
    }
  }

  openProductSelector(): void {
    const dialogRef = this.dialog.open(RewardProductSelectorDialogComponent, {
      width: '960px',
      maxWidth: '96vw',
      data: {
        mode: this.requiresSingleProductSelection() ? 'single' : 'multiple',
        selectedProductIds: this.selectedProducts().map(
          (item) => item.productId
        ),
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result?: RewardProductSelectionResult) => {
        if (!result) {
          return;
        }

        this.setSelectedProducts(
          result.selectedProducts.map((item) => item.productId),
          result.selectedProducts
        );
      });
  }

  clearProductSelection(): void {
    this.setSelectedProducts([], []);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.resetSelectedImageState();
      return;
    }

    if (file.size > this.maxImageSizeBytes()) {
      this.confirmDialog.alert(
        'Imagen demasiado grande',
        `La imagen supera el limite de ${this.maxImageSizeMb()} MB`
      );
      this.resetSelectedImageState(input);
      return;
    }

    this.selectedImageFile.set(file);
    this.revokeObjectUrl();
    this.createdObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.createdObjectUrl);
  }

  clearSelectedImage(fileInput: HTMLInputElement): void {
    this.resetSelectedImageState(fileInput);
  }

  onSubmit(): void {
    this.submitFeedback.set(null);

    if (this.isSaving()) {
      return;
    }

    if (this.form.invalid) {
      this.showInvalidFormFeedback();
      return;
    }

    if (!this.isEditMode() && !this.selectedImageFile()) {
      this.notifyBlockedSubmit('La imagen es requerida para crear el premio');
      return;
    }

    const rewardType = this.form.value.rewardType || '';

    const selectedProductIds = this.selectedProducts().map(
      (item) => item.productId
    );
    const productIdsPayload =
      selectedProductIds.length > 0 ? selectedProductIds : null;
    const appliesToAllEligibleProducts = this.isDiscountReward()
      ? this.form.value.appliesToAllEligibleProducts !== false
      : false;
    const singleProductSelectionRule =
      this.isDiscountReward() && !appliesToAllEligibleProducts
        ? this.form.value.singleProductSelectionRule
        : null;

    if (!this.validateProductRules(rewardType, selectedProductIds)) {
      return;
    }

    if (
      this.isDiscountReward() &&
      !appliesToAllEligibleProducts &&
      !singleProductSelectionRule
    ) {
      this.notifyBlockedSubmit(
        'Debes seleccionar la regla de producto único: más costoso o más económico'
      );
      return;
    }

    if (
      (rewardType === 'DISCOUNT_PERCENTAGE' ||
        rewardType === 'DISCOUNT_FIXED') &&
      (!this.form.value.discountValue || this.form.value.discountValue <= 0)
    ) {
      this.notifyBlockedSubmit(
        'Para descuentos, discountValue debe ser mayor a 0'
      );
      return;
    }

    const availableFromIso = this.toIso(this.form.value.availableFrom || '');
    const availableUntilIso = this.toIso(this.form.value.availableUntil || '');

    if (!this.validateDateRules(availableFromIso, availableUntilIso)) {
      return;
    }

    const rawCouponQuantity = this.form.value.couponQuantity;
    const couponQuantity =
      rawCouponQuantity === null || rawCouponQuantity === undefined
        ? null
        : Number(rawCouponQuantity);

    const request: CreateLoyaltyRewardRequest = {
      name: (this.form.value.name || '').trim(),
      description: (this.form.value.description || '').trim(),
      rewardType,
      pointsCost: Number(this.form.value.pointsCost),
      discountValue: this.form.value.discountValue || undefined,
      productIds: productIdsPayload,
      appliesToAllEligibleProducts,
      singleProductSelectionRule,
      image: this.selectedImageFile() || undefined,
      isActive: true,
      couponQuantity,
      stock: couponQuantity,
      validityDays: this.form.value.validityDays || null,
      availableFrom: availableFromIso,
      availableUntil: availableUntilIso,
      termsAndConditions:
        this.form.value.termsAndConditions?.trim() || undefined,
      displayOrder: 1,
    };

    this.isSaving.set(true);

    const rewardId = this.rewardId();
    const request$ =
      this.isEditMode() && rewardId
        ? this.loyaltyAdminService.updateReward(rewardId, request)
        : this.loyaltyAdminService.createReward(request);

    request$.subscribe({
      next: () => {
        this.submitFeedback.set(null);
        this.toastService.success(
          this.isEditMode()
            ? 'Premio actualizado correctamente'
            : 'Premio creado correctamente'
        );
        this.isSaving.set(false);
        this.goBack();
      },
      error: (err) => {
        const message = extractApiErrorMessage(err);
        this.submitFeedback.set(message);
        this.toastService.error(message);
        console.error('[RewardForm] Error saving reward', err);
        this.isSaving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/tenant-admin/loyalty/rewards']);
  }

  private setSelectedProducts(
    productIds: string[],
    preferred: Array<{ productId: string; productName: string }> = []
  ): void {
    const preferredMap = new Map(
      preferred.map((item) => [item.productId, item.productName])
    );
    const selected = productIds.map((productId) => ({
      productId,
      productName: preferredMap.get(productId) || 'Producto seleccionado',
    }));

    this.selectedProducts.set(selected);
    this.form.patchValue({
      productIds:
        selected.length > 0 ? selected.map((item) => item.productId) : null,
    });
  }

  private loadProductNamesByIds(productIds: string[]): void {
    for (const productId of productIds) {
      this.productService.getById(productId).subscribe({
        next: (product) => {
          this.selectedProducts.update((current) =>
            current.map((item) =>
              item.productId === productId
                ? {
                    productId,
                    productName: product.name || 'Producto seleccionado',
                  }
                : item
            )
          );
        },
      });
    }
  }

  private validateProductRules(
    rewardType: string,
    selectedProductIds: string[]
  ): boolean {
    if (rewardType === RewardType.PRODUCT && selectedProductIds.length !== 1) {
      this.notifyBlockedSubmit(
        'Para tipo PRODUCT debes seleccionar exactamente 1 producto'
      );
      return false;
    }

    return true;
  }

  private validateDateRules(
    availableFromIso: string | null,
    availableUntilIso: string | null
  ): boolean {
    if (
      availableFromIso &&
      availableUntilIso &&
      new Date(availableFromIso).getTime() >
        new Date(availableUntilIso).getTime()
    ) {
      this.notifyBlockedSubmit(
        'La fecha inicial no puede ser mayor a la fecha final'
      );
      return false;
    }

    return true;
  }

  private showInvalidFormFeedback(): void {
    this.form.markAllAsTouched();
    const invalidMessages: string[] = [];

    if (this.form.get('name')?.invalid) {
      invalidMessages.push('Nombre (mínimo 3 caracteres)');
    }

    if (this.form.get('description')?.invalid) {
      invalidMessages.push('Descripción (mínimo 10 caracteres)');
    }

    if (this.form.get('pointsCost')?.invalid) {
      invalidMessages.push('Costo en puntos (mayor a 0)');
    }

    if (invalidMessages.length > 0) {
      this.notifyBlockedSubmit(
        `Completa los campos requeridos: ${invalidMessages.join(', ')}`
      );
      return;
    }

    this.notifyBlockedSubmit('Completa los campos requeridos del formulario');
  }

  private notifyBlockedSubmit(message: string): void {
    this.submitFeedback.set(message);
    this.toastService.warning(message);
  }

  private revokeObjectUrl(): void {
    if (this.createdObjectUrl) {
      URL.revokeObjectURL(this.createdObjectUrl);
      this.createdObjectUrl = null;
    }
  }

  private resetSelectedImageState(fileInput?: HTMLInputElement): void {
    if (fileInput) {
      fileInput.value = '';
    }

    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.revokeObjectUrl();
  }

  private toIso(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private toDateTimeLocal(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
}
