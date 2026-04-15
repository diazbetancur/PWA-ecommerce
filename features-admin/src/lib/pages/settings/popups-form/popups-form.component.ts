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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AppButtonComponent,
  buildAppSnackBarConfig,
  ConfirmationDialogService,
  extractApiErrorMessage,
} from '@pwa/shared';
import {
  CreatePopupRequest,
  PopupResponse,
  UpdatePopupRequest,
} from '../../../models/popup.model';
import { PopupService } from '../../../services/popup.service';

type PopupDateValue = Date | string | null;

@Component({
  selector: 'lib-popups-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './popups-form.component.html',
  styleUrls: ['./popups-form.component.scss'],
})
export class PopupsFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly popupService = inject(PopupService);
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
  private readonly confirmDialog = inject(ConfirmationDialogService);

  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly popupId = signal<string | null>(null);
  readonly popup = signal<PopupResponse | null>(null);
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  private createdObjectUrl: string | null = null;

  readonly form: FormGroup;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Popup' : 'Nuevo Popup'
  );

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Crear'
  );

  readonly currentImageUrl = computed(() => this.popup()?.imageUrl || null);

  readonly maxImageSizeMb = computed(() => 1);

  readonly maxImageSizeBytes = computed(() => 1024 * 1024);

  readonly hasImagePreview = computed(
    () => !!this.imagePreviewUrl() || !!this.currentImageUrl()
  );

  readonly displayPreviewUrl = computed(
    () => this.imagePreviewUrl() || this.currentImageUrl()
  );

  constructor() {
    this.form = this.fb.group({
      targetUrl: ['', [Validators.maxLength(300)]],
      buttonText: ['', [Validators.maxLength(60)]],
      startDate: [null],
      endDate: [null],
      isActive: [false],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.popupId.set(id);
      this.isEditMode.set(true);
      this.loadPopup(id);
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

    if (!this.selectedImageFile()) {
      this.snackBar.open(
        'La imagen es requerida para guardar el popup',
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
      this.updatePopup(payload as UpdatePopupRequest);
    } else {
      this.createPopup(payload as CreatePopupRequest);
    }
  }

  cancel(): void {
    this.router.navigate(['/tenant-admin/settings/popups']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }

  private loadPopup(id: string): void {
    this.loading.set(true);

    this.popupService.getById(id).subscribe({
      next: (popup) => {
        this.popup.set(popup);
        this.form.patchValue({
          targetUrl: popup.targetUrl || '',
          buttonText: popup.buttonText || '',
          startDate: this.toDateInputValue(popup.startDate),
          endDate: this.toDateInputValue(popup.endDate),
          isActive: popup.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar popup', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/settings/popups']);
      },
    });
  }

  private createPopup(data: CreatePopupRequest): void {
    this.popupService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Popup creado exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/settings/popups']);
      },
      error: (error) => {
        this.snackBar.open(extractApiErrorMessage(error), 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  private updatePopup(data: UpdatePopupRequest): void {
    const id = this.popupId();
    if (!id) {
      return;
    }

    this.popupService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Popup actualizado exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/settings/popups']);
      },
      error: (error) => {
        this.snackBar.open(extractApiErrorMessage(error), 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  private buildPayload(): CreatePopupRequest | UpdatePopupRequest {
    const value = this.form.value;

    return {
      targetUrl: value.targetUrl || undefined,
      buttonText: value.buttonText || undefined,
      startDate: this.toIsoDate(value.startDate),
      endDate: this.toIsoDate(value.endDate),
      isActive: !!value.isActive,
      image: this.selectedImageFile() as File,
    };
  }

  private validateDateRange(): boolean {
    const start = this.form.get('startDate')?.value as PopupDateValue;
    const end = this.form.get('endDate')?.value as PopupDateValue;

    if (!start || !end) {
      return true;
    }

    return new Date(start).getTime() <= new Date(end).getTime();
  }

  private toIsoDate(value?: PopupDateValue): string | undefined {
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
