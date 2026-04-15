import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TenantAdminMenuService } from '@pwa/core';
import {
  AppButtonComponent,
  buildAppSnackBarConfig,
  ConfirmationDialogService,
} from '@pwa/shared';
import { PopupListItem, PopupListParams } from '../../../models/popup.model';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'lib-popups-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './popups-list.component.html',
  styleUrls: ['./popups-list.component.scss'],
})
export class PopupsListComponent implements OnInit {
  private readonly popupService = inject(PopupService);
  private readonly menuService = inject(TenantAdminMenuService);
  private readonly router = inject(Router);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly snackBar = {
    open: (message: string, action?: string, config?: MatSnackBarConfig) =>
      this.matSnackBar.open(
        message,
        action,
        buildAppSnackBarConfig(message, config)
      ),
  };
  private readonly confirmDialog = inject(ConfirmationDialogService);

  readonly popups = signal<PopupListItem[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly displayedColumns = computed(() => {
    const baseColumns = [
      'preview',
      'active',
      'period',
      'targetUrl',
      'buttonText',
    ];

    if (this.canUpdate() || this.canDelete()) {
      return [...baseColumns, 'actions'];
    }

    return baseColumns;
  });

  readonly canCreate = computed(() =>
    this.menuService.canPerformAction('settings')
  );

  readonly canUpdate = computed(() =>
    this.menuService.canPerformAction('settings')
  );

  readonly canDelete = computed(() =>
    this.menuService.canPerformAction('settings')
  );

  ngOnInit(): void {
    this.loadPopups();
  }

  onFilterChanged(filter: 'all' | 'active' | 'inactive'): void {
    this.activeFilter.set(filter);
    this.page.set(1);
    this.loadPopups();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadPopups();
  }

  createPopup(): void {
    this.router.navigate(['/tenant-admin/settings/popups/create']);
  }

  editPopup(popup: PopupListItem): void {
    this.router.navigate(['/tenant-admin/settings/popups', popup.id, 'edit']);
  }

  deletePopup(popup: PopupListItem): void {
    this.confirmDialog
      .confirm({
        title: 'Eliminar popup',
        message:
          '¿Estás seguro de eliminar este popup? Esta acción no se puede deshacer.',
        type: 'danger',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.loading.set(true);
        this.popupService.delete(popup.id).subscribe({
          next: () => {
            this.snackBar.open('Popup eliminado exitosamente', 'Cerrar', {
              duration: 3000,
            });
            this.loadPopups();
          },
          error: (error) => {
            this.snackBar.open(
              error?.error?.message || 'Error al eliminar popup',
              'Cerrar',
              { duration: 3000 }
            );
            this.loading.set(false);
          },
        });
      });
  }

  formatDateRange(startDate?: string | null, endDate?: string | null): string {
    if (!startDate && !endDate) {
      return 'Siempre activo (sin fechas)';
    }

    const start = startDate
      ? new Date(startDate).toLocaleDateString('es-CO')
      : 'Sin inicio';
    const end = endDate
      ? new Date(endDate).toLocaleDateString('es-CO')
      : 'Sin fin';

    return `${start} - ${end}`;
  }

  private loadPopups(): void {
    this.loading.set(true);

    const isActive =
      this.activeFilter() === 'all'
        ? undefined
        : this.activeFilter() === 'active';

    const params: PopupListParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      isActive,
    };

    this.popupService.list(params).subscribe({
      next: (response) => {
        this.popups.set(response.items);
        this.totalCount.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar popups', 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }
}
