import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LoyaltyRedemptionDto,
  PagedLoyaltyRedemptionsResponse,
  REDEMPTION_STATUS_COLORS,
  REDEMPTION_STATUS_LABELS,
  RedemptionStatus,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';

/**
 * 🎟️ Lista de Canjes (Admin)
 *
 * Gestión de todos los canjes de premios:
 * - Ver todos los canjes
 * - Filtrar por estado y usuario
 * - Aprobar/entregar/cancelar canjes
 * - Ver detalles completos
 */
@Component({
  selector: 'lib-redemptions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="redemptions-list-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>🎟️ Gestión de Canjes</h1>
          <p>Administra todos los canjes de premios del programa</p>
        </div>
        @if (pendingCount() > 0) {
        <div class="pending-alert">
          <span class="icon">⏳</span>
          <span
            ><strong>{{ pendingCount() }}</strong> canjes pendientes</span
          >
        </div>
        }
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="statusFilter">Estado:</label>
          <select
            id="statusFilter"
            [(ngModel)]="selectedStatus"
            (change)="onFilterChange()"
            class="form-select"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="DELIVERED">Entregado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="userSearch">Usuario:</label>
          <input
            type="text"
            id="userSearch"
            [(ngModel)]="userSearch"
            (input)="onFilterChange()"
            placeholder="Buscar por email o nombre..."
            class="form-input"
          />
        </div>

        <div class="filter-group">
          <label for="fromDate">Desde:</label>
          <input
            type="date"
            id="fromDate"
            [(ngModel)]="fromDate"
            (change)="onFilterChange()"
            class="form-input"
          />
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando canjes...</p>
      </div>
      }

      <!-- Error State -->
      @if (error()) {
      <div class="alert alert-danger">
        <strong>Error:</strong> {{ error() }}
      </div>
      }

      <!-- Redemptions Table -->
      @if (!isLoading() && redemptions().length > 0) {
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Premio</th>
              <th>Puntos</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (redemption of redemptions(); track redemption.id) {
            <tr>
              <td class="user-cell">
                <div class="user-info">
                  <strong>{{ redemption.userName || 'Usuario' }}</strong>
                  <span class="user-email">{{ redemption.userEmail }}</span>
                </div>
              </td>
              <td class="reward-cell">
                <div class="reward-info">
                  <strong>{{ redemption.rewardName }}</strong>
                  @if (redemption.couponCode) {
                  <span class="coupon-code">
                    <span class="icon">🎫</span>
                    {{ redemption.couponCode }}
                  </span>
                  }
                </div>
              </td>
              <td class="points-cell">
                <span class="icon">💎</span>
                {{ redemption.pointsSpent | number }}
              </td>
              <td class="date-cell">
                {{ formatDate(redemption.redeemedAt) }}
              </td>
              <td>
                <span
                  class="status-badge"
                  [attr.data-status]="getStatusColor(redemption.status)"
                >
                  {{ getStatusLabel(redemption.status) }}
                </span>
              </td>
              <td class="actions-cell">
                @if (redemption.status === 'PENDING') {
                <button
                  class="btn-sm success"
                  (click)="approveRedemption(redemption)"
                  title="Aprobar"
                >
                  ✓ Aprobar
                </button>
                <button
                  class="btn-sm danger"
                  (click)="cancelRedemption(redemption)"
                  title="Cancelar"
                >
                  ✕ Cancelar
                </button>
                } @if (redemption.status === 'APPROVED') {
                <button
                  class="btn-sm info"
                  (click)="markAsDelivered(redemption)"
                  title="Marcar como entregado"
                >
                  📦 Entregar
                </button>
                }
                <button
                  class="btn-sm"
                  (click)="viewDetails(redemption)"
                  title="Ver detalles"
                >
                  👁️ Ver
                </button>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
      <div class="pagination">
        <button
          class="page-btn"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)"
        >
          ← Anterior
        </button>

        <span class="page-info">
          Página {{ currentPage() }} de {{ totalPages() }}
          <span class="total-items">({{ totalItems() }} canjes)</span>
        </span>

        <button
          class="page-btn"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)"
        >
          Siguiente →
        </button>
      </div>
      } }

      <!-- Empty State -->
      @if (!isLoading() && redemptions().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">🎟️</div>
        <h3>No hay canjes</h3>
        <p>No se encontraron canjes con los filtros seleccionados</p>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .redemptions-list-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        gap: 20px;
      }

      .header-content h1 {
        font-size: 2rem;
        color: #333;
        margin-bottom: 5px;
      }

      .header-content p {
        color: #6c757d;
      }

      .pending-alert {
        padding: 12px 20px;
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #856404;
        font-weight: 600;
      }

      .pending-alert .icon {
        font-size: 1.5rem;
      }

      /* Filters */
      .filters-section {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      }

      .filter-group {
        flex: 1;
        min-width: 200px;
      }

      .filter-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-select,
      .form-input {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .form-select:focus,
      .form-input:focus {
        outline: none;
        border-color: #007bff;
      }

      /* Loading & Errors */
      .loading-container {
        text-align: center;
        padding: 60px 20px;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .alert-danger {
        padding: 15px;
        border-radius: 8px;
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        margin-bottom: 20px;
      }

      /* Table */
      .table-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        background: #f8f9fa;
        padding: 15px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
      }

      .data-table td {
        padding: 15px;
        border-bottom: 1px solid #dee2e6;
      }

      .data-table tbody tr:hover {
        background: #f8f9fa;
      }

      .user-cell .user-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .user-email {
        font-size: 0.85rem;
        color: #6c757d;
      }

      .reward-cell .reward-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .coupon-code {
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: monospace;
        font-size: 0.9rem;
        color: #0056b3;
        background: #e7f3ff;
        padding: 4px 8px;
        border-radius: 4px;
        width: fit-content;
      }

      .points-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #007bff;
      }

      .points-cell .icon {
        font-size: 1.1rem;
      }

      .date-cell {
        font-size: 0.9rem;
        color: #6c757d;
      }

      .status-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
      }

      .status-badge[data-status='warning'] {
        background: #ffc107;
        color: #000;
      }
      .status-badge[data-status='success'] {
        background: #28a745;
      }
      .status-badge[data-status='info'] {
        background: #17a2b8;
      }
      .status-badge[data-status='danger'] {
        background: #dc3545;
      }
      .status-badge[data-status='secondary'] {
        background: #6c757d;
      }

      /* Actions */
      .actions-cell {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn-sm {
        padding: 6px 12px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-sm:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .btn-sm.success {
        background: #d4edda;
        color: #155724;
        border-color: #c3e6cb;
      }

      .btn-sm.success:hover {
        background: #c3e6cb;
      }

      .btn-sm.danger {
        background: #f8d7da;
        color: #721c24;
        border-color: #f5c6cb;
      }

      .btn-sm.danger:hover {
        background: #f5c6cb;
      }

      .btn-sm.info {
        background: #d1ecf1;
        color: #0c5460;
        border-color: #bee5eb;
      }

      .btn-sm.info:hover {
        background: #bee5eb;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .page-btn {
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
      }

      .page-btn:hover:not(:disabled) {
        background: #0056b3;
      }

      .page-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .page-info {
        font-weight: 600;
        color: #333;
        text-align: center;
      }

      .total-items {
        display: block;
        font-size: 0.85rem;
        font-weight: normal;
        color: #6c757d;
        margin-top: 3px;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 80px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .empty-icon {
        font-size: 5rem;
        margin-bottom: 20px;
      }

      .empty-state h3 {
        font-size: 1.5rem;
        color: #333;
        margin-bottom: 10px;
      }

      .empty-state p {
        color: #6c757d;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
        }

        .filters-section {
          flex-direction: column;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          min-width: 900px;
        }
      }
    `,
  ],
})
export class RedemptionsListComponent implements OnInit {
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);

  // Signals
  redemptions = signal<LoyaltyRedemptionDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pendingCount = signal(0);

  // Filters
  selectedStatus = '';
  userSearch = '';
  fromDate = '';
  pageSize = 15;

  ngOnInit(): void {
    this.loadRedemptions();
  }

  /**
   * Cargar canjes
   */
  private loadRedemptions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyAdminService
      .listAllRedemptions({
        page: this.currentPage(),
        pageSize: this.pageSize,
        status: this.selectedStatus || undefined,
        fromDate: this.fromDate || undefined,
      })
      .subscribe({
        next: (response: PagedLoyaltyRedemptionsResponse) => {
          this.redemptions.set(response.items);
          this.totalPages.set(response.totalPages);
          this.totalItems.set(response.totalItems);

          // Contar pendientes
          const pending = response.items.filter(
            (r) => r.status === 'PENDING'
          ).length;
          this.pendingCount.set(pending);

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando canjes:', err);
          this.error.set(
            'No se pudieron cargar los canjes. Por favor, intenta de nuevo.'
          );
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Cambio en filtros
   */
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadRedemptions();
  }

  /**
   * Ir a página
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadRedemptions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Obtener etiqueta del estado
   */
  getStatusLabel(status: string): string {
    return REDEMPTION_STATUS_LABELS[status] || status;
  }

  /**
   * Obtener color del estado
   */
  getStatusColor(status: string): string {
    return REDEMPTION_STATUS_COLORS[status] || 'secondary';
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Aprobar canje
   */
  approveRedemption(redemption: LoyaltyRedemptionDto): void {
    const notes = prompt('Notas de aprobación (opcional):');
    if (notes === null) return; // Usuario canceló

    this.loyaltyAdminService
      .updateRedemptionStatus(redemption.id, {
        status: RedemptionStatus.APPROVED,
        adminNotes: notes || undefined,
      })
      .subscribe({
        next: () => {
          alert('Canje aprobado exitosamente');
          this.loadRedemptions();
        },
        error: (err) => {
          console.error('Error aprobando canje:', err);
          alert('No se pudo aprobar el canje');
        },
      });
  }

  /**
   * Marcar como entregado
   */
  markAsDelivered(redemption: LoyaltyRedemptionDto): void {
    if (
      confirm(
        `¿Confirmar que el premio "${redemption.rewardName}" fue entregado?`
      )
    ) {
      this.loyaltyAdminService
        .updateRedemptionStatus(redemption.id, {
          status: RedemptionStatus.DELIVERED,
        })
        .subscribe({
          next: () => {
            alert('Premio marcado como entregado');
            this.loadRedemptions();
          },
          error: (err) => {
            console.error('Error marcando como entregado:', err);
            alert('No se pudo actualizar el estado');
          },
        });
    }
  }

  /**
   * Cancelar canje
   */
  cancelRedemption(redemption: LoyaltyRedemptionDto): void {
    const reason = prompt('Razón de cancelación:');
    if (!reason) return;

    this.loyaltyAdminService
      .updateRedemptionStatus(redemption.id, {
        status: RedemptionStatus.CANCELLED,
        adminNotes: reason,
      })
      .subscribe({
        next: () => {
          alert('Canje cancelado. Los puntos serán reembolsados al usuario.');
          this.loadRedemptions();
        },
        error: (err) => {
          console.error('Error cancelando canje:', err);
          alert('No se pudo cancelar el canje');
        },
      });
  }

  /**
   * Ver detalles del canje
   */
  viewDetails(redemption: LoyaltyRedemptionDto): void {
    const details = `
      Premio: ${redemption.rewardName}
      Usuario: ${redemption.userName} (${redemption.userEmail})
      Puntos: ${redemption.pointsSpent}
      ${redemption.couponCode ? `Código: ${redemption.couponCode}` : ''}
      Estado: ${this.getStatusLabel(redemption.status)}
      Fecha: ${this.formatDate(redemption.redeemedAt)}
      ${redemption.adminNotes ? `Notas: ${redemption.adminNotes}` : ''}
    `;
    alert(details);
  }
}
