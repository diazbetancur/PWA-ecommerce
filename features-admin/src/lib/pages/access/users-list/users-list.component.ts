/**
 * 👤 Users List Component
 *
 * Pantalla principal de gestión de usuarios del tenant (CRUD).
 * Ruta: /tenant-admin/access/users
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@pwa/shared';
import { TenantUserService } from '../../../services/tenant-user.service';
import { TenantUserSummaryDto } from '../../../models/tenant-user.model';
import { UserDialogComponent } from '../../../components/user-dialog/user-dialog.component';
import { catchError, finalize, of, tap } from 'rxjs';

@Component({
  selector: 'lib-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(TenantUserService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly listType = signal<'staff' | 'customers'>('staff');
  readonly title = signal('Usuarios del Tenant');
  readonly subtitle = signal(
    'Gestiona los usuarios y empleados con acceso al panel administrativo'
  );
  readonly createLabel = signal('Crear usuario');
  readonly emptyTitle = signal('No hay usuarios creados');
  readonly emptyDescription = signal(
    'Crea el primer usuario para empezar a gestionar tu equipo'
  );
  readonly loadingLabel = signal('Cargando usuarios...');
  readonly errorTitle = signal('Error al cargar usuarios');

  // Estado
  readonly users = signal<TenantUserSummaryDto[]>([]);
  readonly isLoading = signal(false);
  readonly isError = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Columnas de la tabla
  readonly displayedColumns = [
    'name',
    'email',
    'roles',
    'status',
    'lastLogin',
    'actions',
  ];

  ngOnInit(): void {
    const routeListType = this.route.snapshot.data['userSegment'];
    if (routeListType === 'customers') {
      this.listType.set('customers');
      this.title.set('Clientes');
      this.subtitle.set('Gestiona los usuarios con rol Customer');
      this.createLabel.set('Crear cliente');
      this.emptyTitle.set('No hay clientes creados');
      this.emptyDescription.set(
        'Crea el primer cliente para empezar a gestionar este segmento'
      );
      this.loadingLabel.set('Cargando clientes...');
      this.errorTitle.set('Error al cargar clientes');
    }

    this.loadUsers();
  }

  /**
   * Cargar lista de usuarios
   */
  loadUsers(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.errorMessage.set(null);

    const listRequest =
      this.listType() === 'customers'
        ? this.userService.listCustomers()
        : this.userService.listStaff();

    listRequest
      .pipe(
        tap((response) => {
          this.users.set(response.users);
        }),
        catchError((error) => {
          this.isError.set(true);
          this.errorMessage.set(
            error.message || 'Error al cargar la lista de usuarios'
          );
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  /**
   * Abrir diálogo para crear usuario
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  /**
   * Abrir diálogo para editar usuario
   */
  openEditDialog(user: TenantUserSummaryDto): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      data: { mode: 'edit', userId: user.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  /**
   * Navegar a asignación de roles
   */
  navigateToRoles(user: TenantUserSummaryDto): void {
    this.router.navigate(['/tenant-admin/access/users', user.id, 'roles']);
  }

  /**
   * Alternar estado activo/inactivo
   */
  toggleUserStatus(user: TenantUserSummaryDto): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activar' : 'desactivar';

    const dialogRef = this.dialog.open<
      ConfirmationDialogComponent,
      ConfirmationDialogData
    >(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} usuario`,
        message: `¿Estás seguro de que deseas ${action} a ${user.firstName} ${user.lastName}?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Cancelar',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.userService
          .toggleStatus(user.id, newStatus)
          .pipe(
            tap(() => {
              this.loadUsers();
            }),
            catchError((error) => {
              alert(`Error al ${action} usuario: ${error.message}`);
              return of(null);
            })
          )
          .subscribe();
      }
    });
  }

  /**
   * Eliminar usuario
   */
  deleteUser(user: TenantUserSummaryDto): void {
    const dialogRef = this.dialog.open<
      ConfirmationDialogComponent,
      ConfirmationDialogData
    >(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar usuario',
        message: `¿Estás seguro de que deseas eliminar a ${user.firstName} ${user.lastName}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.userService
          .delete(user.id)
          .pipe(
            tap(() => {
              this.loadUsers();
            }),
            catchError((error) => {
              alert(`Error al eliminar usuario: ${error.message}`);
              return of(null);
            })
          )
          .subscribe();
      }
    });
  }

  /**
   * Obtener badge de rol
   */
  getRoleBadgeColor(role: string): string {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('admin')) return 'primary';
    if (roleLower.includes('manager')) return 'accent';
    return 'default';
  }

  /**
   * Formatear fecha de último login
   */
  formatLastLogin(date?: string): string {
    if (!date) return 'Nunca';

    const loginDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - loginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;

    return loginDate.toLocaleDateString();
  }
}
