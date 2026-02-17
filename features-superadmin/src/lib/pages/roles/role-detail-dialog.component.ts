/**
 * 🔍 Diálogo de Detalle de Rol
 *
 * Muestra información completa de un rol:
 * - Todos los permisos asociados agrupados por recurso
 * - Lista de usuarios que tienen este rol
 * - Estadísticas del rol
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminUserSummaryDto } from '../../models/admin-user.model';
import { AdminUserManagementService } from '../../services/admin-user-management.service';

interface RoleInfo {
  name: string;
  label: string;
  description: string;
  color: string;
  permissions: string[];
  userCount: number;
}

interface GroupedPermissions {
  resource: string;
  resourceLabel: string;
  permissions: Array<{ key: string; label: string }>;
}

@Component({
  selector: 'lib-role-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './role-detail-dialog.component.html',
  styleUrl: './role-detail-dialog.component.scss',
})
export class RoleDetailDialogComponent implements OnInit {
  readonly data = inject<{ role: RoleInfo }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RoleDetailDialogComponent>);
  private readonly userService = inject(AdminUserManagementService);

  // 🔄 Estado
  readonly isLoadingUsers = signal(false);
  readonly users = signal<AdminUserSummaryDto[]>([]);
  readonly groupedPermissions = signal<GroupedPermissions[]>([]);

  get role(): RoleInfo {
    return this.data.role;
  }

  ngOnInit(): void {
    this.groupPermissions();
    void this.loadUsersWithRole();
  }

  /**
   * Agrupar permisos por recurso para mejor visualización
   */
  private groupPermissions(): void {
    if (this.role.permissions.includes('*')) {
      // SuperAdmin - acceso total
      this.groupedPermissions.set([
        {
          resource: 'all',
          resourceLabel: 'Sistema Completo',
          permissions: [{ key: '*', label: 'Acceso Total sin Restricciones' }],
        },
      ]);
      return;
    }

    const grouped = new Map<string, Array<{ key: string; label: string }>>();

    for (const permission of this.role.permissions) {
      const [resource] = permission.split(':');
      
      if (!grouped.has(resource)) {
        grouped.set(resource, []);
      }

      const permissions = grouped.get(resource);
      if (permissions) {
        permissions.push({
          key: permission,
          label: this.formatPermission(permission),
        });
      }
    }

    const result: GroupedPermissions[] = [];
    const resourceLabels: Record<string, string> = {
      tenants: 'Gestión de Comercios',
      users: 'Gestión de Usuarios',
      subscriptions: 'Gestión de Subscripciones',
      system: 'Configuración del Sistema',
      analytics: 'Analytics y Reportes',
      billing: 'Facturación',
    };

    for (const [resource, permissions] of grouped.entries()) {
      result.push({
        resource,
        resourceLabel: resourceLabels[resource] || resource,
        permissions,
      });
    }

    this.groupedPermissions.set(result);
  }

  /**
   * Cargar usuarios que tienen este rol
   */
  private async loadUsersWithRole(): Promise<void> {
    this.isLoadingUsers.set(true);

    try {
      const response = await this.userService.getUsers({
        page: 1,
        pageSize: 1000,
      });

      // Filtrar usuarios que tienen este rol
      const usersWithRole = response.items.filter((user) =>
        user.roles.includes(this.role.name)
      );

      this.users.set(usersWithRole);
    } catch (err: unknown) {
    } finally {
      this.isLoadingUsers.set(false);
    }
  }

  /**
   * Formatear nombre de permiso para UI
   */
  formatPermission(permission: string): string {
    if (permission === '*') {
      return 'Acceso Total';
    }

    const [, action] = permission.split(':');

    const actionLabels: Record<string, string> = {
      view: 'Ver y Consultar',
      create: 'Crear Nuevos',
      edit: 'Editar y Modificar',
      delete: 'Eliminar',
      configure: 'Configurar',
      'manage-roles': 'Gestionar Roles',
      cancel: 'Cancelar',
      'view-config': 'Ver Configuración',
      'edit-config': 'Editar Configuración',
      'view-logs': 'Ver Logs',
      'manage-features': 'Gestionar Features',
      export: 'Exportar Datos',
      manage: 'Gestionar',
    };

    return actionLabels[action] || action;
  }

  /**
   * Obtener ícono para un recurso
   */
  getResourceIcon(resource: string): string {
    const icons: Record<string, string> = {
      all: 'all_inclusive',
      tenants: 'business',
      users: 'people',
      subscriptions: 'card_membership',
      system: 'settings',
      analytics: 'analytics',
      billing: 'payments',
    };

    return icons[resource] || 'lock';
  }

  /**
   * Obtener clase de color para el chip de permiso
   */
  getPermissionChipClass(action: string): string {
    if (action.includes('delete')) return 'permission-delete';
    if (action.includes('create')) return 'permission-create';
    if (action.includes('edit') || action.includes('manage'))
      return 'permission-edit';
    return 'permission-view';
  }

  /**
   * Cerrar diálogo
   */
  close(): void {
    this.dialogRef.close();
  }
}
