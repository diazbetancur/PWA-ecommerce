import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmationDialogService } from '@pwa/shared';
import { TenantDetailDialogComponent } from '../../components/tenant-detail-dialog/tenant-detail-dialog.component';
import { TenantEditDialogComponent } from '../../components/tenant-edit-dialog/tenant-edit-dialog.component';
import { TenantListItem, TenantStatus } from '../../models/tenant.model';
import { TenantAdminService } from '../../services/tenant-admin.service';

@Component({
  selector: 'lib-tenants-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenants-list.component.html',
  styleUrl: './tenants-list.component.scss',
})
export class TenantsListComponent {
  private readonly tenantService = inject(TenantAdminService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  // Expose enum to template
  readonly TenantStatus = TenantStatus;

  // State
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly tenants = signal<TenantListItem[]>([]);

  // Pagination
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly totalCount = signal(0);
  readonly totalPages = computed(() =>
    Math.ceil(this.totalCount() / this.pageSize())
  );

  // Filters
  readonly searchQuery = signal('');
  readonly statusFilter = signal<TenantStatus | null>(null);
  readonly planFilter = signal<string | null>(null);

  // Computed
  readonly startIndex = computed(
    () => (this.currentPage() - 1) * this.pageSize() + 1
  );
  readonly endIndex = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalCount())
  );

  constructor() {
    this.loadTenants();
  }

  async loadTenants(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await this.tenantService.listTenants({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        status: this.statusFilter() || undefined,
        planId: this.planFilter() || undefined,
      });

      this.tenants.set(response.items);
      this.totalCount.set(response.totalCount);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Error al cargar comercios'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // Search & Filters
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadTenants();
    }, 500);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadTenants();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadTenants();
  }

  hasActiveFilters(): boolean {
    return !!this.searchQuery() || !!this.statusFilter() || !!this.planFilter();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set(null);
    this.planFilter.set(null);
    this.currentPage.set(1);
    this.loadTenants();
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadTenants();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadTenants();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadTenants();
    }
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
    this.loadTenants();
  }

  // Actions
  navigateToCreate(): void {
    this.router.navigate(['/admin/tenants/create']);
  }

  viewTenant(tenantId: string): void {
    this.dialog.open(TenantDetailDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { tenantId },
    });
  }

  editTenant(tenantId: string): void {
    const dialogRef = this.dialog.open(TenantEditDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { tenantId },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        void this.loadTenants();
      }
    });
  }

  deleteTenant(tenant: TenantListItem): void {
    this.confirmDialog.confirmDelete(
      tenant.name,
      'Esta acción no se puede deshacer. Se eliminará el comercio y todos sus datos.'
    ).subscribe(async (confirmed) => {
      if (!confirmed) return;

      try {
        await this.tenantService.deleteTenant(tenant.id);
        
        this.confirmDialog.confirm({
          title: 'Eliminación exitosa',
          message: `El comercio "${tenant.name}" ha sido eliminado correctamente.`,
          confirmText: 'Aceptar',
          type: 'info',
          icon: 'check_circle',
        }).subscribe();
        
        await this.loadTenants();
      } catch (err) {
        this.confirmDialog.confirm({
          title: 'Error al eliminar',
          message: err instanceof Error
            ? err.message
            : 'Error al eliminar el comercio. Por favor, inténtelo nuevamente.',
          confirmText: 'Aceptar',
          type: 'danger',
          icon: 'error',
        }).subscribe();
      }
    });
  }

  // Utilities
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
