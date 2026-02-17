/**
 * 📝 Dialog de Crear/Editar Usuario Administrativo
 *
 * Form con validaciónes para:
 * - Crear nuevo usuario (email, nombre, contraseña, roles)
 * - Editar usuario existente (email, nombre, estado)
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  AdminRoleLabels,
  AdminRoleName,
  AdminUserSummaryDto,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from '../../models/admin-user.model';
import { AdminUserManagementService } from '../../services/admin-user-management.service';

export interface AdminUserDialogData {
  mode: 'create' | 'edit';
  user?: AdminUserSummaryDto;
}

@Component({
  selector: 'lib-admin-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-user-dialog.component.html',
  styleUrl: './admin-user-dialog.component.scss',
})
export class AdminUserDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<AdminUserDialogComponent>
  );
  private readonly data = inject<AdminUserDialogData>(MAT_DIALOG_DATA);
  private readonly userService = inject(AdminUserManagementService);

  // 🎯 Estado
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // 🔧 Configuración
  readonly mode = this.data.mode;
  readonly isEditMode = this.mode === 'edit';
  readonly title = this.isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario';

  // 📋 Form
  form!: FormGroup;

  // 🎨 Roles disponibles
  readonly roleOptions = Object.values(AdminRoleName);
  readonly roleLabels = AdminRoleLabels;

  ngOnInit(): void {
    this.buildForm();
  }

  /**
   * Construir formulario según el modo
   */
  private buildForm(): void {
    if (this.isEditMode && this.data.user) {
      // Modo edición - solo campos editables
      this.form = this.fb.group({
        email: [
          this.data.user.email,
          [Validators.required, Validators.email],
        ],
        fullName: [
          this.data.user.fullName,
          [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
        ],
        isActive: [this.data.user.isActive],
      });
    } else {
      // Modo creación - todos los campos incluida contraseña
      this.form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        fullName: [
          '',
          [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
        ],
        password: [
          '',
          [Validators.required, Validators.minLength(8)],
        ],
        roleNames: [
          [],
          [Validators.required, Validators.minLength(1)],
        ],
      });
    }
  }

  /**
   * Guardar (crear o actualizar)
   */
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSaving.set(true);
      this.error.set(null);
      this.successMessage.set(null);

      if (this.isEditMode && this.data.user) {
        // Actualizar usuario
        const request: UpdateAdminUserRequest = {
          email: this.form.value.email,
          fullName: this.form.value.fullName,
          isActive: this.form.value.isActive,
        };

        await this.userService.updateUser(this.data.user.id, request);
        this.successMessage.set('Usuario actualizado exitosamente');
        
        // Cerrar dialog después de 1 segundo
        setTimeout(() => {
          this.dialogRef.close({ success: true });
        }, 1000);

      } else {
        // Crear usuario
        const request: CreateAdminUserRequest = {
          email: this.form.value.email,
          fullName: this.form.value.fullName,
          password: this.form.value.password,
          roleNames: this.form.value.roleNames,
        };

        await this.userService.createUser(request);
        
        this.successMessage.set('Usuario creado exitosamente');

        // Cerrar dialog después de 1.5 segundos
        setTimeout(() => {
          this.dialogRef.close({ success: true });
        }, 1500);
      }

    } catch (err: unknown) {
      console.error('Error al guardar usuario:', err);
      
      const error = err as { status?: number; error?: { detail?: string } };
      // Manejar errores específicos
      if (error.status === 400 || error.status === 409) {
        this.error.set(error.error?.detail || 'El email ya está en uso');
      } else if (error.status === 422) {
        this.error.set('Datos inválidos. Verifique los campos');
      } else {
        this.error.set('Error al guardar el usuario. Intente nuevamente');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Cerrar dialog
   */
  cancel(): void {
    this.dialogRef.close({ success: false });
  }

  /**
   * Obtener mensaje de error de un campo
   */
  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres`;
    }
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `Máximo ${max} caracteres`;
    }

    return 'Campo inválido';
  }

  /**
   * Verificar si un campo tiene error
   */
  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Obtener descripción de un rol
   */
  getRoleDescription(role: string): string {
    return AdminRoleLabels[role as AdminRoleName]?.description || '';
  }
}
