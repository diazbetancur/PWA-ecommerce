import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
  extractApiErrorMessage,
} from '@pwa/shared';
import { BannerListItem, BannerListParams } from '../../../models/banner.model';
import { BannerService } from '../../../services/banner.service';

@Component({
  selector: 'lib-banners-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banners-list.component.html',
  styleUrls: ['./banners-list.component.scss'],
})
export class BannersListComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
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

  readonly banners = signal<BannerListItem[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly searchValue = signal('');

  readonly displayedColumns = computed(() => {
    const baseColumns = [
      'title',
      'position',
      'displayOrder',
      'active',
      'period',
    ];

    if (this.canUpdate() || this.canDelete()) {
      return [...baseColumns, 'actions'];
    }

    return baseColumns;
  });

  readonly canCreate = computed(() =>
    this.menuService.canPerformAction('catalog')
  );

  readonly canUpdate = computed(() =>
    this.menuService.canPerformAction('catalog')
  );

  readonly canDelete = computed(() =>
    this.menuService.canPerformAction('catalog')
  );

  ngOnInit(): void {
    this.loadBanners();
  }

  onSearchChanged(value: string): void {
    this.searchValue.set(value);
    this.page.set(1);
    this.loadBanners();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadBanners();
  }

  createBanner(): void {
    this.router.navigate(['/tenant-admin/catalog/banners/create']);
  }

  editBanner(banner: BannerListItem): void {
    this.router.navigate(['/tenant-admin/catalog/banners', banner.id, 'edit']);
  }

  deleteBanner(banner: BannerListItem): void {
    this.confirmDialog
      .confirm({
        title: 'Eliminar banner',
        message: `¿Estás seguro de eliminar el banner "${banner.title}"?`,
        type: 'danger',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.loading.set(true);
        this.bannerService.delete(banner.id).subscribe({
          next: () => {
            this.snackBar.open('Banner eliminado exitosamente', 'Cerrar', {
              duration: 3000,
            });
            this.loadBanners();
          },
          error: (error) => {
            this.snackBar.open(extractApiErrorMessage(error), 'Cerrar', {
              duration: 3000,
            });
            this.loading.set(false);
          },
        });
      });
  }

  formatDateRange(startDate?: string | null, endDate?: string | null): string {
    if (!startDate && !endDate) {
      return 'Sin programación';
    }

    const start = startDate
      ? new Date(startDate).toLocaleDateString('es-CO')
      : 'Sin inicio';
    const end = endDate
      ? new Date(endDate).toLocaleDateString('es-CO')
      : 'Sin fin';

    return `${start} - ${end}`;
  }

  private loadBanners(): void {
    this.loading.set(true);

    const params: BannerListParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchValue() || undefined,
    };

    this.bannerService.list(params).subscribe({
      next: (response) => {
        this.banners.set(response.items);
        this.totalCount.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar banners', 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }
}
