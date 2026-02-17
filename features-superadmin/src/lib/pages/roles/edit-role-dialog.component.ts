/**
 * ✏️ Diálogo de Edición de Rol
 */

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminRoleDetailDto } from '../../models/admin-user.model';
import { AdminRolesService } from '../../services/admin-roles.service';

interface EditRoleDialogData {
  role: AdminRoleDetailDto;
}

@Component({
  selector: 'lib-edit-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-role-dialog.component.html',
  styleUrl: './edit-role-dialog.component.scss',
})
export class EditRoleDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(AdminRolesService);
  private readonly dialogRef = inject(MatDialogRef<EditRoleDialogComponent>);
  private readonly data = inject<EditRoleDialogData>(MAT_DIALOG_DATA);

  readonly form: FormGroup;
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly role = this.data.role;

  constructor() {
    this.form = this.fb.group({
      name: [
        { value: this.role.name, disabled: this.role.isSystemRole || false },
        [Validators.required, Validators.minLength(3)]
      ],
      description: [this.role.description || ''],
    });
  }

  /**
   * Verificar si el formulario tiene cambios
   */
  hasChanges(): boolean {
    const nameChanged = !this.role.isSystemRole && 
      this.form.value.name !== this.role.name;
    const descChanged = this.form.value.description !== (this.role.description || '');
    return nameChanged || descChanged;
  }

  /**
   * Actualizar el rol
   */
  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.hasChanges()) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      await this.rolesService.updateRole(this.role.id, {
        name: this.role.isSystemRole ? undefined : this.form.value.name.trim(),
        description: this.form.value.description?.trim() || undefined,
      });

      this.dialogRef.close(true); // Cierra y notifica actualización exitosa
    } catch (err: unknown) {
      this.error.set('Error al actualizar el rol. Verifique que el nombre no exista.');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Cancelar y cerrar
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
