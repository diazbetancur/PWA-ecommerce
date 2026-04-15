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
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { AppEnvService } from '@pwa/core';
import {
  AppButtonComponent,
  buildAppSnackBarConfig,
  ConfirmationDialogService,
  extractApiErrorMessage,
} from '@pwa/shared';
import {
  BannerResponse,
  CreateBannerRequest,
  UpdateBannerRequest,
} from '../../../models/banner.model';
import { BannerService } from '../../../services/banner.service';

type BannerDateValue = Date | string | null;

@Component({
  selector: 'lib-banners-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banners-form.component.html',
  styleUrls: ['./banners-form.component.scss'],
})
export class BannersFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly bannerService = inject(BannerService);
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
  private readonly appEnv = inject(AppEnvService);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly bannerId = signal<string | null>(null);
  readonly banner = signal<BannerResponse | null>(null);
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  private createdObjectUrl: string | null = null;

  readonly form: FormGroup;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Banner' : 'Nuevo Banner'
  );

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Crear'
  );

  readonly currentImageUrl = computed(() => this.banner()?.imageUrl || null);

  readonly maxImageSizeMb = computed(() => this.appEnv.categoryImageMaxSizeMb);

  readonly maxImageSizeBytes = computed(
    () => this.maxImageSizeMb() * 1024 * 1024
  );

  readonly hasImagePreview = computed(
    () => !!this.imagePreviewUrl() || !!this.currentImageUrl()
  );

  readonly displayPreviewUrl = computed(
    () => this.imagePreviewUrl() || this.currentImageUrl()
  );

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      subtitle: ['', [Validators.maxLength(160)]],
      targetUrl: ['', [Validators.maxLength(300)]],
      buttonText: ['', [Validators.maxLength(60)]],
      startDate: [null],
      endDate: [null],
      displayOrder: [1, [Validators.required, Validators.min(1)]],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.bannerId.set(id);
      this.isEditMode.set(true);
      this.loadBanner(id);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
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
        `La imagen supera el límite de ${this.maxImageSizeMb()} MB`
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.validateDateRange()) {
      this.snackBar.open(
        'La fecha final debe ser mayor o igual a la inicial',
        'Cerrar',
        {
          duration: 3000,
        }
      );
      return;
    }

    if (!this.isEditMode() && !this.selectedImageFile()) {
      this.snackBar.open(
        'La imagen es requerida para crear un banner',
        'Cerrar',
        {
          duration: 3000,
        }
      );
      return;
    }

    this.loading.set(true);

    const payload = this.buildPayload();

    if (this.isEditMode()) {
      this.updateBanner(payload as UpdateBannerRequest);
    } else {
      this.createBanner(payload as CreateBannerRequest);
    }
  }

  cancel(): void {
    this.router.navigate(['/tenant-admin/catalog/banners']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['min']) {
      return `El valor mínimo es ${control.errors['min'].min}`;
    }

    return 'Campo inválido';
  }

  private loadBanner(id: string): void {
    this.loading.set(true);

    this.bannerService.getById(id).subscribe({
      next: (banner) => {
        this.banner.set(banner);
        this.form.patchValue({
          title: banner.title,
          subtitle: banner.subtitle || '',
          targetUrl: banner.targetUrl || '',
          buttonText: banner.buttonText || '',
          startDate: this.toDateInputValue(banner.startDate),
          endDate: this.toDateInputValue(banner.endDate),
          displayOrder: banner.displayOrder,
          isActive: banner.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar banner', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/banners']);
      },
    });
  }

  private createBanner(data: CreateBannerRequest): void {
    this.bannerService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Banner creado exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/banners']);
      },
      error: (error) => {
        this.snackBar.open(extractApiErrorMessage(error), 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  private updateBanner(data: UpdateBannerRequest): void {
    const id = this.bannerId();
    if (!id) {
      return;
    }

    this.bannerService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Banner actualizado exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/banners']);
      },
      error: (error) => {
        this.snackBar.open(extractApiErrorMessage(error), 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  private buildPayload(): CreateBannerRequest | UpdateBannerRequest {
    const value = this.form.value;

    return {
      title: value.title,
      subtitle: value.subtitle || undefined,
      targetUrl: value.targetUrl || undefined,
      buttonText: value.buttonText || undefined,
      position: 'Hero',
      startDate: this.toIsoDate(value.startDate),
      endDate: this.toIsoDate(value.endDate),
      displayOrder: Number(value.displayOrder ?? 1),
      isActive: !!value.isActive,
      image: this.selectedImageFile() || undefined,
    };
  }

  private validateDateRange(): boolean {
    const start = this.form.get('startDate')?.value as BannerDateValue;
    const end = this.form.get('endDate')?.value as BannerDateValue;

    if (!start || !end) {
      return true;
    }

    return new Date(start).getTime() <= new Date(end).getTime();
  }

  private toIsoDate(value?: BannerDateValue): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`).toISOString();
    }

    return new Date(value).toISOString();
  }

  private toDateInputValue(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 10);
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
}
