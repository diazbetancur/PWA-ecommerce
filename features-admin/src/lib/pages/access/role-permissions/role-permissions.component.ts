/**
 * 🔐 Role Permissions Component
 *
 * Matriz de permisos por módulo para un rol específico.
 * Ruta: /tenant-admin/access/roles/:roleId/permissions
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@pwa/shared';
import { PermissionService } from '../../../services/permission.service';
import {
  ModuleDto,
  ModulePermissionDto,
  UpdateRolePermissionsRequest,
} from '../../../models/rbac.model';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface PermissionRow {
  module: ModuleDto;
  permission: ModulePermissionDto;
  // Flags para saber qué acciones están disponibles
  hasView: boolean;
  hasCreate: boolean;
  hasUpdate: boolean;
  hasDelete: boolean;
}

@Component({
  selector: 'lib-role-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './role-permissions.component.html',
  styleUrl: './role-permissions.component.scss',
})
export class RolePermissionsComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // Estado
  readonly roleId = signal<string>('');
  readonly roleName = signal<string>('');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isError = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Datos
  readonly permissionRows = signal<PermissionRow[]>([]);
  readonly originalPermissions = signal<ModulePermissionDto[]>([]);

  // Computed: detectar cambios
  readonly isDirty = computed(() => {
    const current = this.permissionRows().map((r) => r.permission);
    const original = this.originalPermissions();

    return JSON.stringify(current) !== JSON.stringify(original);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('roleId');
    if (!id) {
      this.router.navigate(['/tenant-admin/access/roles']);
      return;
    }

    this.roleId.set(id);
    this.loadPermissions();
  }

  /**
   * Cargar módulos disponibles y permisos actuales en paralelo
   */
  private loadPermissions(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.errorMessage.set(null);

    forkJoin({
      modules: this.permissionService.getAvailableModules(),
      permissions: this.permissionService.getRolePermissions(this.roleId()),
    })
      .pipe(
        tap(({ modules, permissions }) => {
          this.roleName.set(permissions.roleName);

          // Construir filas solo con módulos activos
          const activeModules = modules.modules.filter((m) => m.isActive);
          const rows: PermissionRow[] = activeModules.map((module) => {
            // Buscar permisos existentes para este módulo
            const existing = permissions.permissions.find(
              (p) => p.moduleCode === module.code
            );

            // Determinar qué acciones están disponibles
            const hasView = module.availablePermissions.includes('view');
            const hasCreate = module.availablePermissions.includes('create');
            const hasUpdate = module.availablePermissions.includes('update');
            const hasDelete = module.availablePermissions.includes('delete');

            return {
              module,
              permission: existing || {
                moduleCode: module.code,
                moduleName: module.name,
                canView: false,
                canCreate: false,
                canUpdate: false,
                canDelete: false,
              },
              hasView,
              hasCreate,
              hasUpdate,
              hasDelete,
            };
          });

          this.permissionRows.set(rows);

          // Guardar estado original para detectar cambios
          this.originalPermissions.set(
            rows.map((r) => ({ ...r.permission }))
          );
        }),
        catchError((error) => {
          this.isError.set(true);
          this.errorMessage.set(
            error?.error?.message ||
              'Error al cargar permisos. Por favor, intente nuevamente.'
          );
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  /**
   * Marcar todo en una fila (row action)
   */
  setRowAll(row: PermissionRow): void {
    row.permission.canView = row.hasView;
    row.permission.canCreate = row.hasCreate;
    row.permission.canUpdate = row.hasUpdate;
    row.permission.canDelete = row.hasDelete;
    this.permissionRows.update((rows) => [...rows]); // Trigger change detection
  }

  /**
   * Marcar solo lectura en una fila
   */
  setRowReadOnly(row: PermissionRow): void {
    row.permission.canView = row.hasView;
    row.permission.canCreate = false;
    row.permission.canUpdate = false;
    row.permission.canDelete = false;
    this.permissionRows.update((rows) => [...rows]);
  }

  /**
   * Limpiar todos los permisos de una fila
   */
  clearRow(row: PermissionRow): void {
    row.permission.canView = false;
    row.permission.canCreate = false;
    row.permission.canUpdate = false;
    row.permission.canDelete = false;
    this.permissionRows.update((rows) => [...rows]);
  }

  /**
   * Seleccionar todo (global)
   */
  selectAll(): void {
    this.permissionRows.update((rows) =>
      rows.map((row) => {
        row.permission.canView = row.hasView;
        row.permission.canCreate = row.hasCreate;
        row.permission.canUpdate = row.hasUpdate;
        row.permission.canDelete = row.hasDelete;
        return row;
      })
    );
  }

  /**
   * Limpiar todo (global)
   */
  clearAll(): void {
    this.permissionRows.update((rows) =>
      rows.map((row) => {
        row.permission.canView = false;
        row.permission.canCreate = false;
        row.permission.canUpdate = false;
        row.permission.canDelete = false;
        return row;
      })
    );
  }

  /**
   * Guardar cambios
   */
  onSave(): void {
    if (!this.isDirty() || this.isSaving()) {
      return;
    }

    // Construir request: solo módulos con al menos un permiso
    const permissions = this.permissionRows()
      .filter(
        (r) =>
          r.permission.canView ||
          r.permission.canCreate ||
          r.permission.canUpdate ||
          r.permission.canDelete
      )
      .map((r) => ({
        moduleCode: r.permission.moduleCode,
        canView: r.permission.canView,
        canCreate: r.permission.canCreate,
        canUpdate: r.permission.canUpdate,
        canDelete: r.permission.canDelete,
      }));

    const request: UpdateRolePermissionsRequest = { permissions };

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.permissionService
      .updateRolePermissions(this.roleId(), request)
      .pipe(
        tap(() => {
          // TODO: Mostrar toast de éxito

          // Actualizar baseline (original)
          this.originalPermissions.set(
            this.permissionRows().map((r) => ({ ...r.permission }))
          );
        }),
        catchError((error) => {
          this.errorMessage.set(
            error?.error?.message ||
              'Error al guardar permisos. Por favor, intente nuevamente.'
          );
          return of(null);
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe();
  }

  /**
   * Descartar cambios y volver
   */
  onCancel(): void {
    if (this.isDirty()) {
      const dialogData: ConfirmationDialogData = {
        title: 'Descartar cambios',
        message:
          'Hay cambios sin guardar. ¿Está seguro de que desea salir sin guardar?',
        confirmText: 'Sí, descartar',
        cancelText: 'No, continuar editando',
        type: 'warning',
      };

      this.dialog
        .open(ConfirmationDialogComponent, {
          width: '400px',
          data: dialogData,
        })
        .afterClosed()
        .subscribe((confirmed) => {
          if (confirmed) {
            this.navigateBack();
          }
        });
    } else {
      this.navigateBack();
    }
  }

  /**
   * Navegar de regreso a la lista de roles
   */
  private navigateBack(): void {
    this.router.navigate(['/tenant-admin/access/roles']);
  }

  /**
   * Reintentar carga
   */
  retry(): void {
    this.loadPermissions();
  }

  /**
   * Actualizar checkbox (trigger change detection)
   */
  onCheckboxChange(): void {
    this.permissionRows.update((rows) => [...rows]);
  }
}
