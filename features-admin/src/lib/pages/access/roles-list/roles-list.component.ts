/**
 * 🔐 Roles List Component
 *
 * Pantalla principal de gestión de roles (CRUD).
 * Ruta: /tenant-admin/access/roles
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@pwa/shared';
import { RoleService } from '../../../services/role.service';
import { RoleSummaryDto } from '../../../models/rbac.model';
import { RoleDialogComponent } from '../../../components/role-dialog/role-dialog.component';
import { catchError, finalize, of, tap } from 'rxjs';

@Component({
  selector: 'lib-roles-list',
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
  ],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss',
})
export class RolesListComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  // Estado
  readonly roles = signal<RoleSummaryDto[]>([]);
  readonly isLoading = signal(false);
  readonly isError = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Columnas de la tabla
  readonly displayedColumns = [
    'name',
    'description',
    'type',
    'usersCount',
    'actions',
  ];

  ngOnInit(): void {
    this.loadRoles();
  }

  /**
   * Cargar lista de roles
   */
  loadRoles(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.errorMessage.set(null);

    this.roleService
      .list()
      .pipe(
        tap((response) => {
          this.roles.set(response.roles);
        }),
        catchError((error) => {
          console.error('Error al cargar roles:', error);
          this.isError.set(true);
          this.errorMessage.set(
            error?.error?.message ||
              'Error al cargar roles. Por favor, intente nuevamente.'
          );
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  /**
   * Abrir dialog para crear nuevo rol
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '500px',
      data: null, // null = crear
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles(); // Recargar la lista
      }
    });
  }

  /**
   * Abrir dialog para editar rol
   */
  openEditDialog(role: RoleSummaryDto): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '500px',
      data: role,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
      }
    });
  }

  /**
   * Navegar a permisos del rol
   */
  navigateToPermissions(role: RoleSummaryDto): void {
    this.router.navigate(['/tenant-admin/access/roles', role.id, 'permissions']);
  }

  /**
   * Eliminar rol con confirmación
   */
  confirmDelete(role: RoleSummaryDto): void {
    // Validar si es rol del sistema
    if (role.isSystemRole) {
      this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'No se puede eliminar',
          message:
            'Este es un rol del sistema y no puede ser eliminado. Los roles del sistema son esenciales para el funcionamiento de la aplicación.',
          type: 'warning',
          confirmText: 'Entendido',
          cancelText: '',
        } as ConfirmationDialogData,
      });
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Eliminar rol',
      message: `¿Está seguro de que desea eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_forever',
    };

    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    confirmDialog.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteRole(role);
      }
    });
  }

  /**
   * Ejecutar eliminación del rol
   */
  private deleteRole(role: RoleSummaryDto): void {
    this.roleService
      .delete(role.id)
      .pipe(
        tap(() => {
          // Eliminar de la lista local
          const updated = this.roles().filter((r) => r.id !== role.id);
          this.roles.set(updated);

          // TODO: Mostrar toast de éxito
          console.log('Rol eliminado exitosamente');
        }),
        catchError((error) => {
          console.error('Error al eliminar rol:', error);

          // Manejar error 409 (Conflict) - rol con usuarios asignados
          if (error?.status === 409) {
            this.dialog.open(ConfirmationDialogComponent, {
              width: '400px',
              data: {
                title: 'No se puede eliminar',
                message:
                  error?.error?.message ||
                  'No se puede eliminar el rol porque tiene usuarios asignados. Primero debe reasignar los usuarios a otro rol.',
                type: 'warning',
                confirmText: 'Entendido',
                cancelText: '',
              } as ConfirmationDialogData,
            });
          } else {
            // Otro tipo de error
            this.dialog.open(ConfirmationDialogComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message:
                  error?.error?.message ||
                  'Ocurrió un error al eliminar el rol. Por favor, intente nuevamente.',
                type: 'danger',
                confirmText: 'Cerrar',
                cancelText: '',
              } as ConfirmationDialogData,
            });
          }

          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Verificar si se puede editar el rol
   */
  canEditRole(role: RoleSummaryDto): boolean {
    return !role.isSystemRole;
  }

  /**
   * Verificar si se puede eliminar el rol
   */
  canDeleteRole(role: RoleSummaryDto): boolean {
    return !role.isSystemRole;
  }
}
