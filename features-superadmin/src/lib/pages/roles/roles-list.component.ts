/**
 * 🎭 Componente de Lista de Roles del Sistema
 *
 * Muestra tabla de roles administrativos con:
 * - Nombre del rol
 * - Cantidad de usuarios
 * - Cantidad de permisos
 * - Menú de acciones (ver, editar, eliminar)
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ConfirmationDialogService } from '@pwa/shared';
import { AdminRoleDetailDto } from '../../models/admin-user.model';
import { AdminRolesService } from '../../services/admin-roles.service';
import { CreateRoleDialogComponent } from './create-role-dialog.component';
import { EditRoleDialogComponent } from './edit-role-dialog.component';
import { ManagePermissionsDialogComponent } from './manage-permissions-dialog.component';

@Component({
  selector: 'lib-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss',
})
export class RolesListComponent implements OnInit {
  private readonly rolesService = inject(AdminRolesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  // 🔄 Estado
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly roles = signal<AdminRoleDetailDto[]>([]);

  // Columnas de la tabla
  readonly displayedColumns = ['name', 'description', 'actions'];

  ngOnInit(): void {
    void this.loadRoles();
  }

  /**
   * Cargar todos los roles desde el backend
   */
  async loadRoles(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const roles = await this.rolesService.getAllRoles();
      this.roles.set(roles);
    } catch (err: unknown) {
      console.error('Error al cargar roles:', err);
      this.error.set('Error al cargar los roles del sistema');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Abrir diálogo para crear nuevo rol
   */
  openCreateRoleDialog(): void {
    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((created: boolean) => {
      if (created) {
        void this.loadRoles();
      }
    });
  }

  /**
   * Abrir diálogo para editar rol
   */
  openEditRoleDialog(role: AdminRoleDetailDto): void {
    const dialogRef = this.dialog.open(EditRoleDialogComponent, {
      width: '600px',
      data: { role },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        void this.loadRoles();
      }
    });
  }

  /**
   * Abrir diálogo para gestionar permisos del rol
   */
  openManagePermissionsDialog(role: AdminRoleDetailDto): void {
    const dialogRef = this.dialog.open(ManagePermissionsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { role },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        void this.loadRoles();
      }
    });
  }

  /**
   * Eliminar rol (con confirmación)
   */
  deleteRole(role: AdminRoleDetailDto): void {
    // Validaciones previas
    if (role.isSystemRole) {
      this.confirmDialog.confirm({
        title: 'Acción no permitida',
        message: 'No se pueden eliminar roles del sistema.',
        confirmText: 'Entendido',
        type: 'warning',
        icon: 'block',
      }).subscribe();
      return;
    }

    const userCount = role.userCount || 0;
    if (userCount > 0) {
      this.confirmDialog.confirm({
        title: 'No se puede eliminar',
        message: `El rol "${role.name}" tiene ${userCount} usuario(s) asignado(s).\n\nDebes reasignar los usuarios a otro rol antes de eliminarlo.`,
        confirmText: 'Entendido',
        type: 'warning',
        icon: 'people',
      }).subscribe();
      return;
    }

    // Confirmación de eliminación
    this.confirmDialog.confirmDelete(
      role.name,
      'Esta acción no se puede deshacer.'
    ).subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        await this.rolesService.deleteRole(role.id);
        
        // Mostrar confirmación de éxito
        this.confirmDialog.confirm({
          title: 'Eliminación exitosa',
          message: `El rol "${role.name}" ha sido eliminado correctamente.`,
          confirmText: 'Aceptar',
          type: 'info',
          icon: 'check_circle',
        }).subscribe();
        
        await this.loadRoles();
      } catch (err: unknown) {
        console.error('Error al eliminar rol:', err);
        this.confirmDialog.confirm({
          title: 'Error al eliminar',
          message: 'No se pudo eliminar el rol. Por favor, inténtelo nuevamente.',
          confirmText: 'Aceptar',
          type: 'danger',
          icon: 'error',
        }).subscribe();
      }
    });
  }

  /**
   * Verificar si el rol puede ser eliminado
   */
  canDeleteRole(role: AdminRoleDetailDto): boolean {
    return !role.isSystemRole && (role.userCount || 0) === 0;
  }
}
