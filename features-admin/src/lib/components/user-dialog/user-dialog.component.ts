/**
 * 👤 User Dialog Component
 *
 * Modal para crear o editar usuarios del tenant.
 * Incluye formulario con validaciones y asignación de roles.
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TenantUserService } from '../../services/tenant-user.service';
import { RoleService } from '../../services/role.service';
import { RoleSummaryDto } from '../../models/rbac.model';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';

export interface UserDialogData {
  mode: 'create' | 'edit';
  userId?: string;
}

@Component({
  selector: 'lib-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(TenantUserService);
  private readonly roleService = inject(RoleService);
  private readonly dialogRef = inject(MatDialogRef<UserDialogComponent>);
  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly availableRoles = signal<RoleSummaryDto[]>([]);
  readonly errorMessage = signal<string | null>(null);

  isEditMode = this.data.mode === 'edit';

  readonly userForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: [''],
    password: [
      '',
      this.isEditMode
        ? []
        : [Validators.required, Validators.minLength(6)],
    ],
    confirmPassword: [''],
    roleIds: [[] as string[], [Validators.required]],
    mustChangePassword: [true],
  });

  constructor() {
    // Agregar validador personalizado para confirmar contraseña
    this.userForm
      .get('confirmPassword')
      ?.addValidators(this.passwordMatchValidator.bind(this));
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Cargar datos iniciales (roles disponibles y usuario si es edición)
   */
  private loadInitialData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.isEditMode && this.data.userId) {
      // Modo edición: cargar roles y usuario
      forkJoin({
        roles: this.roleService.list(),
        user: this.userService.getById(this.data.userId),
      })
        .pipe(
          tap(({ roles, user }) => {
            this.availableRoles.set(roles.roles);

            const selectedRoleIds = roles.roles
              .filter((role) => user.roles.includes(role.name))
              .map((role) => role.id);

            this.userForm.patchValue({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber || '',
              roleIds: selectedRoleIds,
            });

            // En modo edición, email es readonly
            this.userForm.get('email')?.disable();
            // Password es opcional en modo edición
            this.userForm.get('password')?.clearValidators();
            this.userForm.get('password')?.updateValueAndValidity();
          }),
          catchError((error) => {
            this.errorMessage.set('Error al cargar los datos del usuario');
            return of(null);
          }),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe();
    } else {
      // Modo creación: solo cargar roles
      this.roleService
        .list()
        .pipe(
          tap((response) => {
            this.availableRoles.set(response.roles);
          }),
          catchError((error) => {
            this.errorMessage.set('Error al cargar los roles disponibles');
            return of(null);
          }),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe();
    }
  }

  /**
   * Validador personalizado para confirmar contraseña
   */
  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = this.userForm?.get('password')?.value;
    const confirmPassword = control.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Guardar usuario (crear o actualizar)
   */
  onSave(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach((key) => {
        const control = this.userForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.userForm.getRawValue();

    if (this.isEditMode && this.data.userId) {
      // Actualizar usuario existente
      this.userService
        .update(this.data.userId, {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phoneNumber: formValue.phoneNumber || undefined,
        })
        .pipe(
          tap(() => {
            // Si se proporcionó una nueva contraseña, actualizarla
            if (formValue.password && this.data.userId) {
              this.userService
                .resetPassword(this.data.userId, {
                  newPassword: formValue.password,
                  mustChangePassword: formValue.mustChangePassword,
                })
                .subscribe();
            }

            // Actualizar roles
            if (this.data.userId) {
              const roleNames = this.availableRoles()
                .filter((role) => formValue.roleIds.includes(role.id))
                .map((role) => role.name);

              this.userService
                .updateRoles(this.data.userId, {
                  roleNames,
                })
                .subscribe();
            }

            this.dialogRef.close(true);
          }),
          catchError((error) => {
            this.errorMessage.set(
              error.message || 'Error al actualizar el usuario'
            );
            return of(null);
          }),
          finalize(() => {
            this.isSaving.set(false);
          })
        )
        .subscribe();
    } else {
      // Crear nuevo usuario
      this.userService
        .create({
          email: formValue.email,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phoneNumber: formValue.phoneNumber || undefined,
          password: formValue.password,
          roleIds: formValue.roleIds,
          mustChangePassword: formValue.mustChangePassword,
        })
        .pipe(
          tap(() => {
            this.dialogRef.close(true);
          }),
          catchError((error) => {
            this.errorMessage.set(
              error.message || 'Error al crear el usuario'
            );
            return of(null);
          }),
          finalize(() => {
            this.isSaving.set(false);
          })
        )
        .subscribe();
    }
  }

  /**
   * Cancelar y cerrar diálogo
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const control = this.userForm.get(fieldName);

    if (!control?.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control.hasError('email')) {
      return 'Email inválido';
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}
