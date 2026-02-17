/**
 * 👥 Componente de Lista de Usuarios Administrativos
 *
 * Tabla completa con:
 * - Paginación
 * - Filtros (búsqueda, rol, estado)
 * - Acciones (crear, editar, roles, activar/desactivar, eliminar)
 * - Indicadores visuales de estado
 */

import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ConfirmationDialogService } from '@pwa/shared';
import {
  AdminRoleLabels,
  AdminRoleName,
  AdminUserQuery,
  AdminUserSummaryDto,
  PagedAdminUsersResponse,
} from '../../models/admin-user.model';
import { AdminUserManagementService } from '../../services/admin-user-management.service';
import { AdminUserDialogComponent } from '../../components/admin-user-dialog/admin-user-dialog.component';
import { AdminUserRolesDialogComponent } from '../../components/admin-user-roles-dialog/admin-user-roles-dialog.component';

@Component({
  selector: 'lib-admin-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './admin-users-list.component.html',
  styleUrl: './admin-users-list.component.scss',
})
export class AdminUsersListComponent implements OnInit {
  private readonly userService = inject(AdminUserManagementService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly router = inject(Router);

  // 🎯 Estado de la tabla
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly users = signal<AdminUserSummaryDto[]>([]);
  readonly totalCount = signal(0);
  readonly currentPage = signal(0); // 0-based para MatPaginator
  readonly pageSize = signal(20);

  // 🔍 Filtros
  readonly searchTerm = signal('');
  readonly selectedRole = signal<string>('all');
  readonly selectedStatus = signal<string>('all');

  // 📊 Datos calculados
  readonly totalPages = computed(() =>
    Math.ceil(this.totalCount() / this.pageSize())
  );
  readonly hasData = computed(() => this.users().length > 0);
  readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasData() && !this.error()
  );

  // 🎨 Configuración de UI
  readonly displayedColumns = [
    'email',
    'fullName',
    'status',
    'lastLogin',
    'actions',
  ];
  readonly roleOptions = Object.values(AdminRoleName);
  readonly roleLabels = AdminRoleLabels;

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Cargar usuarios con los filtros actuales
   */
  async loadUsers(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const query: AdminUserQuery = {
        page: this.currentPage() + 1, // Backend usa 1-based
        pageSize: this.pageSize(),
        search: this.searchTerm() || undefined,
        role: this.selectedRole() === 'all' ? undefined : this.selectedRole(),
        isActive:
          this.selectedStatus() === 'all'
            ? undefined
            : this.selectedStatus() === 'active',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };

      const response: PagedAdminUsersResponse =
        await this.userService.getUsers(query);

      this.users.set(response.items);
      this.totalCount.set(response.totalCount);
    } catch (err: unknown) {
      const error = err as { error?: { detail?: string } };
      this.error.set(
        error.error?.detail || 'Error al cargar la lista de usuarios'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Manejar cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    this.currentPage.set(0); // Reset a primera página
    this.loadUsers();
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('all');
    this.selectedStatus.set('all');
    this.currentPage.set(0);
    this.loadUsers();
  }

  /**
   * Abrir dialog para crear usuario
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AdminUserDialogComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadUsers(); // Recargar lista
      }
    });
  }

  /**
   * Abrir dialog para editar usuario
   */
  openEditDialog(user: AdminUserSummaryDto): void {
    const dialogRef = this.dialog.open(AdminUserDialogComponent, {
      width: '600px',
      data: { mode: 'edit', user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadUsers();
      }
    });
  }

  /**
   * Abrir dialog para gestionar roles
   */
  openRolesDialog(user: AdminUserSummaryDto): void {
    const dialogRef = this.dialog.open(AdminUserRolesDialogComponent, {
      width: '500px',
      data: { user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadUsers();
      }
    });
  }

  /**
   * Cambiar estado de usuario (activar/desactivar)
   * NOTA: Backend usa updateUser con isActive, no un endpoint separado
   */
  toggleUserStatus(user: AdminUserSummaryDto): void {
    const action = user.isActive ? 'desactivar' : 'activar';
    const actionLabel = user.isActive ? 'Desactivar' : 'Activar';

    this.confirmDialog.confirm({
      title: `${actionLabel} Usuario`,
      message: `¿Está seguro que desea ${action} al usuario ${user.email}?`,
      confirmText: actionLabel,
      cancelText: 'Cancelar',
      type: 'warning',
      icon: user.isActive ? 'block' : 'check_circle',
    }).subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        await this.userService.updateUser(user.id, { isActive: !user.isActive });
        
        this.confirmDialog.confirm({
          title: 'Operación exitosa',
          message: `Usuario ${action}do correctamente.`,
          confirmText: 'Aceptar',
          type: 'info',
          icon: 'check_circle',
        }).subscribe();
        
        this.loadUsers();
      } catch (err: unknown) {
        const error = err as { error?: { detail?: string } };
        
        this.confirmDialog.confirm({
          title: 'Error',
          message: error.error?.detail || `Error al ${action} el usuario`,
          confirmText: 'Aceptar',
          type: 'danger',
          icon: 'error',
        }).subscribe();
      }
    });
  }

  /**
   * Eliminar usuario
   */
  deleteUser(user: AdminUserSummaryDto): void {
    this.confirmDialog.confirmDelete(
      user.email,
      'Esta acción no se puede deshacer.'
    ).subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        await this.userService.deleteUser(user.id);
        
        this.confirmDialog.confirm({
          title: 'Eliminación exitosa',
          message: `El usuario "${user.email}" ha sido eliminado correctamente.`,
          confirmText: 'Aceptar',
          type: 'info',
          icon: 'check_circle',
        }).subscribe();
        
        this.loadUsers();
      } catch (err: unknown) {
        const error = err as { error?: { detail?: string } };
        
        this.confirmDialog.confirm({
          title: 'Error al eliminar',
          message: error.error?.detail || 'No se pudo eliminar el usuario. Por favor, inténtelo nuevamente.',
          confirmText: 'Aceptar',
          type: 'danger',
          icon: 'error',
        }).subscribe();
      }
    });
  }

  /**
   * Obtener etiqueta del rol (usado en filtro)
   */
  getRoleLabel(role: string): string {
    return AdminRoleLabels[role as AdminRoleName]?.label || role;
  }

  /**
   * Formatear fecha
   */
  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Verificar si es SuperAdmin (protección)
   */
  isSuperAdmin(user: AdminUserSummaryDto): boolean {
    return user.roles.includes(AdminRoleName.SuperAdmin);
  }
}
