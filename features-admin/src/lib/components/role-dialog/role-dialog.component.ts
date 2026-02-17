/**
 * 🔐 Role Dialog Component
 *
 * Dialog para crear y editar roles.
 * - Modo crear: data = null
 * - Modo editar: data = RoleSummaryDto
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleService } from '../../services/role.service';
import { RoleSummaryDto } from '../../models/rbac.model';
import { catchError, finalize, of, tap } from 'rxjs';

@Component({
  selector: 'lib-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './role-dialog.component.html',
  styleUrl: './role-dialog.component.scss',
})
export class RoleDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<RoleDialogComponent>);
  readonly data = inject<RoleSummaryDto | null>(MAT_DIALOG_DATA);

  // Estado
  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSystemRole = signal(false);

  // Formulario
  roleForm!: FormGroup;

  ngOnInit(): void {
    this.isEditMode.set(this.data !== null);
    this.isSystemRole.set(this.data?.isSystemRole || false);

    this.initForm();
  }

  /**
   * Inicializar formulario
   */
  private initForm(): void {
    this.roleForm = this.fb.group({
      name: [
        { value: this.data?.name || '', disabled: this.isSystemRole() },
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],
      description: [
        this.data?.description || '',
        [Validators.maxLength(200)],
      ],
    });
  }

  /**
   * Obtener título del dialog
   */
  get dialogTitle(): string {
    if (this.isEditMode()) {
      return this.isSystemRole()
        ? `Ver rol: ${this.data?.name}`
        : `Editar rol: ${this.data?.name}`;
    }
    return 'Crear nuevo rol';
  }

  /**
   * Obtener mensaje de ayuda para nombre
   */
  get nameHintMessage(): string {
    if (this.isSystemRole()) {
      return 'Los roles del sistema no pueden cambiar de nombre';
    }
    return 'Nombre descriptivo del rol (3-50 caracteres)';
  }

  /**
   * Guardar rol (crear o actualizar)
   */
  onSave(): void {
    if (this.roleForm.invalid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.roleForm.getRawValue(); // getRawValue incluye disabled fields

    if (this.isEditMode() && this.data) {
      // Actualizar
      this.roleService
        .update(this.data.id, formValue)
        .pipe(
          tap(() => {
            this.dialogRef.close(true); // Cerrar con éxito
          }),
          catchError((error) => {
            this.handleError(error);
            return of(null);
          }),
          finalize(() => this.isSaving.set(false))
        )
        .subscribe();
    } else {
      // Crear
      this.roleService
        .create(formValue)
        .pipe(
          tap(() => {
            this.dialogRef.close(true);
          }),
          catchError((error) => {
            this.handleError(error);
            return of(null);
          }),
          finalize(() => this.isSaving.set(false))
        )
        .subscribe();
    }
  }

  /**
   * Manejar errores del backend
   */
  private handleError(error: any): void {
    // Error 409: Rol con nombre duplicado
    if (error?.status === 409) {
      this.errorMessage.set(
        'Ya existe un rol con ese nombre. Por favor, elija otro nombre.'
      );
    }
    // Error 400: Validación
    else if (error?.status === 400) {
      this.errorMessage.set(
        error?.error?.message ||
          'Datos inválidos. Verifique los campos e intente nuevamente.'
      );
    }
    // Otros errores
    else {
      this.errorMessage.set(
        error?.error?.message ||
          'Ocurrió un error inesperado. Por favor, intente nuevamente.'
      );
    }
  }

  /**
   * Cancelar y cerrar dialog
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Verificar si hay cambios en el formulario
   */
  hasChanges(): boolean {
    return this.roleForm.dirty;
  }
}
