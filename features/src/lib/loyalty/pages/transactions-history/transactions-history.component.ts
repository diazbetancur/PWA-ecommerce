import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LoyaltyTransactionDto,
  PagedLoyaltyTransactionsResponse,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

/**
 * 📊 Historial de Transacciones de Puntos
 *
 * Muestra todos los movimientos de puntos del usuario:
 * - Puntos ganados (compras, acciones)
 * - Puntos gastados (canjes)
 * - Puntos expirados
 * - Ajustes manuales
 */
@Component({
  selector: 'lib-transactions-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transactions-history-page">
      <!-- Header -->
      <div class="page-header">
        <h1>📊 Historial de Puntos</h1>
        <p>Todos los movimientos de tu cuenta de lealtad</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="typeFilter">Tipo:</label>
          <select
            id="typeFilter"
            [(ngModel)]="selectedType"
            (change)="onFilterChange()"
            class="form-select"
          >
            <option value="">Todos</option>
            <option value="EARNED">Ganados</option>
            <option value="REDEEMED">Canjeados</option>
            <option value="EXPIRED">Expirados</option>
            <option value="ADJUSTED">Ajustes</option>
          </select>
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

        <div class="filter-group">
          <label for="toDate">Hasta:</label>
          <input
            type="date"
            id="toDate"
            [(ngModel)]="toDate"
            (change)="onFilterChange()"
            class="form-input"
          />
        </div>
      </div>

      <!-- Summary Cards -->
      @if (!isLoading() && transactions().length > 0) {
      <div class="summary-cards">
        <div class="summary-card earned">
          <div class="icon">⬆️</div>
          <div class="value">+{{ totalEarned() | number : '1.0-0' }}</div>
          <div class="label">Puntos Ganados</div>
        </div>

        <div class="summary-card redeemed">
          <div class="icon">⬇️</div>
          <div class="value">-{{ totalRedeemed() | number : '1.0-0' }}</div>
          <div class="label">Puntos Canjeados</div>
        </div>

        <div class="summary-card net">
          <div class="icon">💎</div>
          <div class="value">{{ netPoints() | number : '1.0-0' }}</div>
          <div class="label">Balance Neto</div>
        </div>
      </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
      }

      <!-- Error State -->
      @if (error()) {
      <div class="alert alert-danger">
        <strong>Error:</strong> {{ error() }}
      </div>
      }

      <!-- Transactions Timeline -->
      @if (!isLoading() && transactions().length > 0) {
      <div class="transactions-timeline">
        @for (transaction of transactions(); track transaction.id) {
        <div class="transaction-item" [attr.data-type]="transaction.type">
          <div class="transaction-icon">
            {{ getTransactionIcon(transaction.type) }}
          </div>

          <div class="transaction-content">
            <div class="transaction-header">
              <h3 class="transaction-description">
                {{ transaction.description }}
              </h3>
              <div
                class="transaction-points"
                [class.positive]="transaction.points > 0"
                [class.negative]="transaction.points < 0"
              >
                {{ transaction.points > 0 ? '+' : ''
                }}{{ transaction.points | number : '1.0-0' }}
              </div>
            </div>

            <div class="transaction-meta">
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                {{ formatDateTime(transaction.createdAt) }}
              </span>

              <span class="meta-item">
                <span class="meta-icon">🏷️</span>
                {{ getTypeLabel(transaction.type) }}
              </span>

              @if (transaction.orderId) {
              <span class="meta-item">
                <span class="meta-icon">🛒</span>
                Orden: {{ transaction.orderId }}
              </span>
              } @if (transaction.redemptionId) {
              <span class="meta-item">
                <span class="meta-icon">🎟️</span>
                Canje: {{ transaction.redemptionId }}
              </span>
              }
            </div>
          </div>
        </div>
        }
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
          <span class="total-items">({{ totalItems() }} transacciones)</span>
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
      @if (!isLoading() && transactions().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No hay transacciones</h3>
        <p>Aún no tienes movimientos en tu cuenta de lealtad</p>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .transactions-history-page {
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
      }

      .page-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .page-header h1 {
        font-size: 2rem;
        color: var(--primary-color, #007bff);
        margin-bottom: 10px;
      }

      .page-header p {
        color: #6c757d;
      }

      /* Filters */
      .filters-section {
        display: flex;
        gap: 15px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      }

      .filter-group {
        flex: 1;
        min-width: 180px;
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
        border-color: var(--primary-color, #007bff);
      }

      /* Summary Cards */
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .summary-card {
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .summary-card.earned {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
      }

      .summary-card.redeemed {
        background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
        color: white;
      }

      .summary-card.net {
        background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
        color: white;
      }

      .summary-card .icon {
        font-size: 2.5rem;
        margin-bottom: 10px;
      }

      .summary-card .value {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .summary-card .label {
        font-size: 0.9rem;
        opacity: 0.9;
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
        border-top: 4px solid var(--primary-color, #007bff);
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

      /* Transactions Timeline */
      .transactions-timeline {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 30px;
      }

      .transaction-item {
        background: white;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        gap: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s;
      }

      .transaction-item:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .transaction-icon {
        width: 50px;
        height: 50px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
      }

      .transaction-item[data-type='EARNED'] .transaction-icon {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      }

      .transaction-item[data-type='REDEEMED'] .transaction-icon {
        background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
      }

      .transaction-item[data-type='EXPIRED'] .transaction-icon {
        background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      }

      .transaction-item[data-type='ADJUSTED'] .transaction-icon {
        background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
      }

      .transaction-content {
        flex: 1;
      }

      .transaction-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
        gap: 15px;
      }

      .transaction-description {
        font-size: 1.1rem;
        color: #333;
        flex: 1;
      }

      .transaction-points {
        font-size: 1.5rem;
        font-weight: bold;
        flex-shrink: 0;
      }

      .transaction-points.positive {
        color: #28a745;
      }

      .transaction-points.negative {
        color: #dc3545;
      }

      .transaction-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        font-size: 0.9rem;
        color: #6c757d;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .meta-icon {
        font-size: 1rem;
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
        background: var(--primary-color, #007bff);
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
        .transaction-item {
          flex-direction: column;
          gap: 15px;
        }

        .transaction-icon {
          align-self: center;
        }

        .transaction-header {
          flex-direction: column;
          align-items: stretch;
        }

        .transaction-meta {
          flex-direction: column;
          gap: 8px;
        }

        .pagination {
          flex-direction: column;
          gap: 15px;
        }

        .page-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class TransactionsHistoryComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);

  // Signals
  transactions = signal<LoyaltyTransactionDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);

  // Filters
  selectedType = '';
  fromDate = '';
  toDate = '';
  pageSize = 15;

  // Computed signals para estadísticas
  totalEarned = signal(0);
  totalRedeemed = signal(0);
  netPoints = signal(0);

  ngOnInit(): void {
    this.loadTransactions();
  }

  /**
   * Cargar transacciones
   */
  private loadTransactions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService
      .getMyTransactions({
        page: this.currentPage(),
        pageSize: this.pageSize,
        type: this.selectedType || undefined,
        fromDate: this.fromDate || undefined,
        toDate: this.toDate || undefined,
      })
      .subscribe({
        next: (response: PagedLoyaltyTransactionsResponse) => {
          this.transactions.set(response.items);
          this.totalPages.set(response.totalPages);
          this.totalItems.set(response.totalItems);
          this.calculateSummary();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando transacciones:', err);
          this.error.set(
            'No se pudieron cargar las transacciones. Por favor, intenta de nuevo.'
          );
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Calcular resumen de puntos
   */
  private calculateSummary(): void {
    const earned = this.transactions()
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);

    const redeemed = Math.abs(
      this.transactions()
        .filter((t) => t.points < 0)
        .reduce((sum, t) => sum + t.points, 0)
    );

    this.totalEarned.set(earned);
    this.totalRedeemed.set(redeemed);
    this.netPoints.set(earned - redeemed);
  }

  /**
   * Cambio en filtros
   */
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadTransactions();
  }

  /**
   * Ir a página
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Obtener icono según tipo
   */
  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      EARNED: '⬆️',
      REDEEMED: '⬇️',
      EXPIRED: '⏰',
      ADJUSTED: '⚙️',
    };
    return icons[type] || '📝';
  }

  /**
   * Obtener etiqueta del tipo
   */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      EARNED: 'Ganados',
      REDEEMED: 'Canjeados',
      EXPIRED: 'Expirados',
      ADJUSTED: 'Ajuste',
    };
    return labels[type] || type;
  }

  /**
   * Formatear fecha y hora
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
