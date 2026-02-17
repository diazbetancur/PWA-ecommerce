/**
 * 🔐 Dialog de Gestión de Roles de Usuario
 *
 * Permite asignar/remover roles a un usuario administrativo
 * con checkboxes y descripciones de cada rol.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AdminRoleLabels,
  AdminRoleName,
  AdminUserSummaryDto,
  UpdateAdminUserRolesRequest,
} from '../../models/admin-user.model';
import { AdminUserManagementService } from '../../services/admin-user-management.service';

export interface AdminUserRolesDialogData {
  user: AdminUserSummaryDto;
}

interface RoleOption {
  name: AdminRoleName;
  label: string;
  description: string;
  color: string;
  selected: boolean;
}

@Component({
  selector: 'lib-admin-user-roles-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-user-roles-dialog.component.html',
  styleUrl: './admin-user-roles-dialog.component.scss',
})
export class AdminUserRolesDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<AdminUserRolesDialogComponent>
  );
  private readonly data = inject<AdminUserRolesDialogData>(MAT_DIALOG_DATA);
  private readonly userService = inject(AdminUserManagementService);

  // 🎯 Estado
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  // 📋 Datos del usuario
  readonly user = this.data.user;

  // 🔐 Roles disponibles
  readonly roleOptions = signal<RoleOption[]>([]);

  // ✅ Cambios pendientes
  readonly hasChanges = signal(false);

  ngOnInit(): void {
    this.initializeRoles();
  }

  /**
   * Inicializar lista de roles con estado seleccionado
   */
  private initializeRoles(): void {
    const options: RoleOption[] = Object.values(AdminRoleName).map((role) => ({
      name: role,
      label: AdminRoleLabels[role].label,
      description: AdminRoleLabels[role].description,
      color: AdminRoleLabels[role].color,
      selected: this.user.roles.includes(role),
    }));

    this.roleOptions.set(options);
  }

  /**
   * Toggle de rol
   */
  onRoleToggle(): void {
    this.hasChanges.set(true);
    this.error.set(null);
  }

  /**
   * Obtener roles seleccionados
   */
  private getSelectedRoles(): string[] {
    return this.roleOptions()
      .filter((r) => r.selected)
      .map((r) => r.name);
  }

  /**
   * Validar que al menos un rol esté seleccionado
   */
  isValid(): boolean {
    return this.getSelectedRoles().length > 0;
  }

  /**
   * Guardar cambios de roles
   */
  async save(): Promise<void> {
    if (!this.isValid()) {
      this.error.set('Debe seleccionar al menos un rol');
      return;
    }

    try {
      this.isSaving.set(true);
      this.error.set(null);

      const request: UpdateAdminUserRolesRequest = {
        roleNames: this.getSelectedRoles(),
      };

      await this.userService.updateUserRoles(this.user.id, request);

      this.dialogRef.close({ success: true });
    } catch (err: unknown) {
      const error = err as { error?: { detail?: string } };
      this.error.set(
        error.error?.detail || 'Error al actualizar los roles del usuario'
      );
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
   * Obtener color del badge según el color del rol
   */
  getRoleBadgeColor(color: string): string {
    const colorMap: Record<string, string> = {
      red: '#d32f2f',
      blue: '#1976d2',
      orange: '#f57c00',
      gray: '#616161',
    };
    return colorMap[color] || '#616161';
  }
}
