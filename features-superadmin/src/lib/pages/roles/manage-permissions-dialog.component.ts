/**
 * 🔐 Diálogo de Gestión de Permisos del Rol
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import {
  AdminPermissionDto,
  AdminRoleDetailDto,
  PermissionGroup,
} from '../../models/admin-user.model';
import { AdminRolesService } from '../../services/admin-roles.service';

interface ManagePermissionsDialogData {
  role: AdminRoleDetailDto;
}

@Component({
  selector: 'lib-manage-permissions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './manage-permissions-dialog.component.html',
  styleUrl: './manage-permissions-dialog.component.scss',
})
export class ManagePermissionsDialogComponent implements OnInit {
  private readonly rolesService = inject(AdminRolesService);
  private readonly dialogRef = inject(MatDialogRef<ManagePermissionsDialogComponent>);
  private readonly data = inject<ManagePermissionsDialogData>(MAT_DIALOG_DATA);

  readonly role = this.data.role;
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly permissionGroups = signal<PermissionGroup[]>([]);
  readonly currentRolePermissions = signal<AdminPermissionDto[]>([]); // Permisos actuales del rol desde backend
  readonly selectedPermissions = signal<Set<string>>(new Set());
  readonly originalPermissions = signal<Set<string>>(new Set());

  ngOnInit(): void {
    console.log('🎬 [ManagePermissionsDialog] ngOnInit - Rol:', this.role.name, 'ID:', this.role.id);
    void this.loadPermissions();
  }

  /**
   * Cargar todos los permisos disponibles y marcar los actuales del rol
   * Hace cruce entre permisos disponibles y permisos asignados al rol
   */
  private async loadPermissions(): Promise<void> {
    console.log('🔄 [ManagePermissionsDialog] Iniciando carga de permisos para rol:', this.role.id);
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // 1. Cargar todos los permisos disponibles en el sistema
      console.log('📋 [ManagePermissionsDialog] Cargando todos los permisos disponibles...');
      const allPermissionsResponse = await this.rolesService.getAllPermissions();
      console.log('✅ [ManagePermissionsDialog] Permisos disponibles cargados:', allPermissionsResponse.groups.length, 'grupos');
      this.permissionGroups.set(allPermissionsResponse.groups);

      // 2. Cargar permisos actuales del rol desde el backend
      console.log('🔍 [ManagePermissionsDialog] Cargando permisos actuales del rol ID:', this.role.id);
      const rolePermissionsResponse = await this.rolesService.getRolePermissions(this.role.id);
      console.log('✅ [ManagePermissionsDialog] Permisos del rol cargados:', rolePermissionsResponse.permissions.length, 'permisos');
      this.currentRolePermissions.set(rolePermissionsResponse.permissions);
      
      // 3. Hacer cruce: marcar permisos que el rol ya tiene
      const currentPermissionIds = new Set(
        rolePermissionsResponse.permissions.map(p => p.id)
      );
      console.log('🎯 [ManagePermissionsDialog] Permisos marcados como seleccionados:', currentPermissionIds.size);
      this.selectedPermissions.set(currentPermissionIds);
      this.originalPermissions.set(new Set(currentPermissionIds));
    } catch (err: unknown) {
      console.error('❌ [ManagePermissionsDialog] Error al cargar permisos:', err);
      this.error.set('Error al cargar los permisos del rol');
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
      group.permissions.forEach(p => selected.add(p.id));
    } else {
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
   * Verificar si hubo cambios
   */
  hasChanges(): boolean {
    const current = this.selectedPermissions();
    const original = this.originalPermissions();
    
    if (current.size !== original.size) return true;
    
    for (const id of current) {
      if (!original.has(id)) return true;
    }
    
    return false;
  }

  /**
   * Guardar cambios de permisos
   */
  async onSave(): Promise<void> {
    if (!this.hasChanges() || this.selectedPermissions().size === 0) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const response = await this.rolesService.updateRolePermissions(this.role.id, {
        permissionIds: Array.from(this.selectedPermissions()),
      });

      // Actualizar permisos actuales con la respuesta del backend
      this.currentRolePermissions.set(response.permissions);
      this.originalPermissions.set(new Set(this.selectedPermissions()));

      this.dialogRef.close(true); // Cierra y notifica cambios
    } catch (err: unknown) {
      console.error('Error al actualizar permisos:', err);
      this.error.set('Error al actualizar los permisos del rol');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Cerrar diálogo
   */
  onClose(): void {
    this.dialogRef.close(false);
  }

  /**
   * Agrupar permisos actuales del rol por recurso (para la pestaña de vista)
   * Usa los permisos cargados desde el backend
   */
  get currentPermissionsByResource(): Map<string, AdminPermissionDto[]> {
    const grouped = new Map<string, AdminPermissionDto[]>();
    
    this.currentRolePermissions().forEach(perm => {
      if (!grouped.has(perm.resource)) {
        grouped.set(perm.resource, []);
      }
      const group = grouped.get(perm.resource);
      if (group) {
        group.push(perm);
      }
    });
    
    return grouped;
  }
}
