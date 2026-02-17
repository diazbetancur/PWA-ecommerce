/**
 * ➕ Diálogo de Creación de Rol
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
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AdminPermissionDto,
  PermissionGroup,
} from '../../models/admin-user.model';
import { AdminRolesService } from '../../services/admin-roles.service';

@Component({
  selector: 'lib-create-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-role-dialog.component.html',
  styleUrl: './create-role-dialog.component.scss',
})
export class CreateRoleDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(AdminRolesService);
  private readonly dialogRef = inject(MatDialogRef<CreateRoleDialogComponent>);

  readonly form: FormGroup;
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly permissionGroups = signal<PermissionGroup[]>([]);
  readonly selectedPermissions = signal<Set<string>>(new Set());

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
    });
  }

  ngOnInit(): void {
    void this.loadPermissions();
  }

  /**
   * Cargar todos los permisos disponibles
   */
  private async loadPermissions(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await this.rolesService.getAllPermissions();
      this.permissionGroups.set(response.groups);
    } catch (err: unknown) {
      console.error('Error al cargar permisos:', err)
      this.error.set('Error al cargar los permisos disponibles');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Toggle selección de permiso individual
   */
  togglePermission(permission: AdminPermissionDto): void {
    const selected = new Set(this.selectedPermissions());
    
    if (selected.has(permission.id)) {
      selected.delete(permission.id);
    } else {
      selected.add(permission.id);
    }
    
    this.selectedPermissions.set(selected);
  }

  /**
   * Verificar si un permiso está seleccionado
   */
  isPermissionSelected(permission: AdminPermissionDto): boolean {
    return this.selectedPermissions().has(permission.id);
  }

  /**
   * Seleccionar/Deseleccionar todos los permisos de un grupo
   */
  toggleGroupPermissions(group: PermissionGroup, event: MatCheckboxChange): void {
    const selected = new Set(this.selectedPermissions());
    
    if (event.checked) {
      // Seleccionar todos del grupo
      group.permissions.forEach(p => selected.add(p.id));
    } else {
      // Deseleccionar todos del grupo
      group.permissions.forEach(p => selected.delete(p.id));
    }
    
    this.selectedPermissions.set(selected);
  }

  /**
   * Verificar si todos los permisos de un grupo están seleccionados
   */
  isGroupFullySelected(group: PermissionGroup): boolean {
    return group.permissions.every(p => 
      this.selectedPermissions().has(p.id)
    );
  }

  /**
   * Verificar si al menos un permiso del grupo está seleccionado
   */
  isGroupPartiallySelected(group: PermissionGroup): boolean {
    const selected = this.selectedPermissions();
    const someSelected = group.permissions.some(p => selected.has(p.id));
    const allSelected = this.isGroupFullySelected(group);
    return someSelected && !allSelected;
  }

  /**
   * Crear el nuevo rol
   */
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.selectedPermissions().size === 0) {
      alert('Debe seleccionar al menos un permiso para el rol');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      await this.rolesService.createRole({
        name: this.form.value.name.trim(),
        description: this.form.value.description?.trim() || undefined,
        permissionIds: Array.from(this.selectedPermissions()),
      });

      this.dialogRef.close(true); // Cierra y notifica creación exitosa
    } catch (err: unknown) {
      console.error('Error al crear rol:', err);
      this.error.set('Error al crear el rol. Verifique que el nombre no exista.');
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
