import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantListItem, TenantStatus } from '../../models/tenant.model';
import { TenantAdminService } from '../../services/tenant-admin.service';

@Component({
  selector: 'lib-tenants-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tenants-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Gestión de Tenants</h1>
          <p class="page-subtitle">
            {{ totalCount() }} tenant{{
              totalCount() !== 1 ? 's' : ''
            }}
            registrado{{ totalCount() !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="header-right">
          <button class="btn btn-primary" (click)="navigateToCreate()">
            <span class="material-icons">add</span>
            Crear Tenant
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-item">
            <span class="filter-label">Buscar</span>
            <div class="search-input-wrapper">
              <span class="material-icons search-icon">search</span>
              <input
                type="text"
                class="search-input"
                placeholder="Buscar por nombre o slug..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
              />
              @if (searchQuery()) {
              <button
                class="clear-search"
                (click)="clearSearch()"
                aria-label="Limpiar búsqueda"
              >
                <span class="material-icons">close</span>
              </button>
              }
            </div>
          </div>

          <div class="filter-item">
            <span class="filter-label">Estado</span>
            <select
              class="filter-select"
              [(ngModel)]="statusFilter"
              (ngModelChange)="onFilterChange()"
            >
              <option [value]="null">Todos</option>
              <option [value]="TenantStatus.Ready">Ready</option>
              <option [value]="TenantStatus.Pending">Pending</option>
              <option [value]="TenantStatus.Seeding">Seeding</option>
              <option [value]="TenantStatus.Suspended">Suspended</option>
              <option [value]="TenantStatus.Failed">Failed</option>
            </select>
          </div>

          <div class="filter-item">
            <span class="filter-label">Plan</span>
            <select
              class="filter-select"
              [(ngModel)]="planFilter"
              (ngModelChange)="onFilterChange()"
            >
              <option [value]="null">Todos</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando tenants...</p>
      </div>
      }

      <!-- Error State -->
      @if (error() && !isLoading()) {
      <div class="error-card">
        <span class="material-icons error-icon">error</span>
        <h3>Error al cargar tenants</h3>
        <p>{{ error() }}</p>
        <button class="btn btn-secondary" (click)="loadTenants()">
          <span class="material-icons">refresh</span>
          Reintentar
        </button>
      </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !error() && tenants().length === 0) {
      <div class="empty-state">
        <span class="material-icons empty-icon">store</span>
        <h3>No hay tenants</h3>
        @if (hasActiveFilters()) {
        <p>No se encontraron tenants con los filtros aplicados</p>
        <button class="btn btn-secondary" (click)="clearFilters()">
          Limpiar filtros
        </button>
        } @else {
        <p>Comienza creando tu primer tenant</p>
        <button class="btn btn-primary" (click)="navigateToCreate()">
          <span class="material-icons">add</span>
          Crear Tenant
        </button>
        }
      </div>
      }

      <!-- Tenants Table -->
      @if (!isLoading() && !error() && tenants().length > 0) {
      <div class="table-container">
        <table class="tenants-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Actualizado</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (tenant of tenants(); track tenant.id) {
            <tr class="tenant-row">
              <td>
                <div class="tenant-info">
                  <div class="tenant-name">{{ tenant.name }}</div>
                  <div class="tenant-slug">{{ tenant.slug }}</div>
                </div>
              </td>
              <td>
                <span class="plan-badge" [class]="'plan-' + tenant.planName">
                  {{ tenant.planName }}
                </span>
              </td>
              <td>
                <span
                  class="status-badge"
                  [class]="'status-' + tenant.status.toLowerCase()"
                >
                  <span class="status-dot"></span>
                  {{ tenant.status }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(tenant.createdAt) }}</td>
              <td class="date-cell">{{ formatDate(tenant.updatedAt) }}</td>
              <td class="actions-cell">
                <div class="actions-buttons">
                  <button
                    class="btn-icon"
                    (click)="viewTenant(tenant.id)"
                    title="Ver detalles"
                  >
                    <span class="material-icons">visibility</span>
                  </button>
                  <button
                    class="btn-icon"
                    (click)="editTenant(tenant.id)"
                    title="Editar"
                  >
                    <span class="material-icons">edit</span>
                  </button>
                  <button
                    class="btn-icon btn-danger"
                    (click)="deleteTenant(tenant)"
                    title="Eliminar"
                  >
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          Mostrando {{ startIndex() }} - {{ endIndex() }} de
          {{ totalCount() }}
        </div>
        <div class="pagination-controls">
          <button
            class="btn-pagination"
            [disabled]="currentPage() === 1"
            (click)="goToPage(1)"
            title="Primera página"
          >
            <span class="material-icons">first_page</span>
          </button>
          <button
            class="btn-pagination"
            [disabled]="currentPage() === 1"
            (click)="previousPage()"
            title="Página anterior"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          <span class="page-numbers">
            Página {{ currentPage() }} de {{ totalPages() }}
          </span>
          <button
            class="btn-pagination"
            [disabled]="currentPage() === totalPages()"
            (click)="nextPage()"
            title="Página siguiente"
          >
            <span class="material-icons">chevron_right</span>
          </button>
          <button
            class="btn-pagination"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(totalPages())"
            title="Última página"
          >
            <span class="material-icons">last_page</span>
          </button>
        </div>
        <div class="pagination-size">
          <label>
            Mostrar
            <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            por página
          </label>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .tenants-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
      }

      .header-left {
        flex: 1;
      }

      .page-title {
        font-size: 2rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle {
        color: #6b7280;
        margin: 0;
        font-size: 0.95rem;
      }

      .header-right {
        display: flex;
        gap: 1rem;
      }

      /* Buttons */
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }

      .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 0.5rem;
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .btn-icon.btn-danger:hover {
        background: #fef2f2;
        color: #dc2626;
      }

      /* Filters Card */
      .filters-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .filters-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 1.5rem;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
      }

      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 1rem;
        color: #9ca3af;
        font-size: 20px;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 3rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 0.95rem;
        transition: all 0.2s;
      }

      .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .clear-search {
        position: absolute;
        right: 0.5rem;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .clear-search:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .clear-search .material-icons {
        font-size: 18px;
      }

      .filter-select {
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 0.95rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* States */
      .loading-container,
      .error-card,
      .empty-state {
        background: white;
        border-radius: 0.75rem;
        padding: 4rem 2rem;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #f3f4f6;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-icon,
      .empty-icon {
        font-size: 64px;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .error-card h3,
      .empty-state h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .error-card p,
      .empty-state p {
        color: #6b7280;
        margin: 0 0 1.5rem 0;
      }

      /* Table */
      .table-container {
        background: white;
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
      }

      .tenants-table {
        width: 100%;
        border-collapse: collapse;
      }

      .tenants-table thead {
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      .tenants-table th {
        padding: 1rem 1.5rem;
        text-align: left;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .tenants-table td {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .tenant-row:hover {
        background: #f9fafb;
      }

      .tenant-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .tenant-name {
        font-weight: 500;
        color: #1f2937;
      }

      .tenant-slug {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .plan-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .plan-Basic {
        background: #dbeafe;
        color: #1e40af;
      }

      .plan-Premium {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .status-ready {
        background: #d1fae5;
        color: #065f46;
      }

      .status-ready .status-dot {
        background: #10b981;
      }

      .status-pending,
      .status-seeding {
        background: #fef3c7;
        color: #92400e;
      }

      .status-pending .status-dot,
      .status-seeding .status-dot {
        background: #f59e0b;
      }

      .status-suspended {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-suspended .status-dot {
        background: #ef4444;
      }

      .status-failed {
        background: #fecaca;
        color: #7f1d1d;
      }

      .status-failed .status-dot {
        background: #dc2626;
      }

      .date-cell {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .actions-cell {
        text-align: right;
      }

      .actions-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }

      /* Pagination */
      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .pagination-info {
        color: #6b7280;
        font-size: 0.95rem;
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-pagination {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }

      .btn-pagination:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
      }

      .btn-pagination:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .page-numbers {
        padding: 0 1rem;
        font-size: 0.95rem;
        color: #374151;
      }

      .pagination-size label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
        font-size: 0.95rem;
      }

      .pagination-size select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        background: white;
        cursor: pointer;
      }
    `,
  ],
})
export class TenantsListComponent {
  private readonly tenantService = inject(TenantAdminService);
  private readonly router = inject(Router);

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
        err instanceof Error ? err.message : 'Error al cargar tenants'
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
    this.router.navigate(['/admin/tenants', tenantId]);
  }

  editTenant(tenantId: string): void {
    this.router.navigate(['/admin/tenants', tenantId, 'edit']);
  }

  async deleteTenant(tenant: TenantListItem): Promise<void> {
    const confirmed = confirm(
      `¿Estás seguro de eliminar el tenant "${tenant.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await this.tenantService.deleteTenant(tenant.id);
      await this.loadTenants();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Error al eliminar el tenant. Inténtalo de nuevo.'
      );
    }
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
