import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LoyaltyRedemptionDto,
  PagedLoyaltyRedemptionsResponse,
  REDEMPTION_STATUS_COLORS,
  REDEMPTION_STATUS_LABELS,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

/**
 * 🎟️ Mis Canjes de Premios
 *
 * Muestra el historial de premios canjeados por el usuario.
 * Incluye:
 * - Estado del canje (pendiente, aprobado, entregado, cancelado)
 * - Código de cupón (si aplica)
 * - Fecha de vencimiento
 * - Detalles del premio canjeado
 */
@Component({
  selector: 'lib-my-redemptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-redemptions.component.html',
  styles: [
    `
      .my-redemptions-page {
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
        margin-bottom: 30px;
      }

      .filter-group {
        max-width: 300px;
      }

      .filter-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-select {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .form-select:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
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

      /* Redemptions List */
      .redemptions-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
      }

      .redemption-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s;
      }

      .redemption-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
      }

      .status-badge {
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
      }

      .status-badge[data-status='warning'] {
        background-color: #ffc107;
        color: #000;
      }
      .status-badge[data-status='success'] {
        background-color: #28a745;
      }
      .status-badge[data-status='info'] {
        background-color: #17a2b8;
      }
      .status-badge[data-status='danger'] {
        background-color: #dc3545;
      }
      .status-badge[data-status='secondary'] {
        background-color: #6c757d;
      }

      .redemption-date {
        font-size: 0.9rem;
        color: #6c757d;
      }

      .card-content {
        padding: 20px;
      }

      .reward-info {
        margin-bottom: 20px;
      }

      .reward-name {
        font-size: 1.4rem;
        color: #333;
        margin-bottom: 10px;
      }

      .points-spent {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6c757d;
      }

      .points-spent .icon {
        font-size: 1.2rem;
      }

      .points-spent .points {
        font-size: 1.2rem;
        font-weight: bold;
        color: #007bff;
      }

      /* Coupon Section */
      .coupon-section {
        margin-bottom: 20px;
        padding: 15px;
        background: #e7f3ff;
        border-radius: 8px;
      }

      .coupon-section .coupon-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .coupon-code {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .coupon-code .code {
        flex: 1;
        padding: 12px;
        background: white;
        border: 2px dashed #007bff;
        border-radius: 8px;
        font-family: monospace;
        font-size: 1.1rem;
        font-weight: bold;
        color: #007bff;
        text-align: center;
      }

      .copy-btn {
        padding: 10px 15px;
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.2rem;
        transition: background 0.2s;
      }

      .copy-btn:hover {
        background: #0056b3;
      }

      /* Timeline */
      .timeline {
        margin-bottom: 20px;
      }

      .timeline-item {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        opacity: 0.4;
      }

      .timeline-item.completed {
        opacity: 1;
      }

      .timeline-icon {
        width: 32px;
        height: 32px;
        background: #28a745;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        flex-shrink: 0;
      }

      .timeline-content {
        flex: 1;
      }

      .timeline-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 3px;
      }

      .timeline-date {
        font-size: 0.85rem;
        color: #6c757d;
      }

      /* Expiration Warning */
      .expiration-warning {
        padding: 12px;
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        color: #856404;
        border-radius: 4px;
        margin-bottom: 15px;
      }

      /* Admin Notes */
      .admin-notes {
        padding: 12px;
        background: #f8f9fa;
        border-left: 4px solid #6c757d;
        border-radius: 4px;
        font-size: 0.9rem;
        color: #495057;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
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
        margin-bottom: 25px;
      }

      .cta-btn {
        padding: 12px 30px;
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .cta-btn:hover {
        background: #0056b3;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .card-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .coupon-code {
          flex-direction: column;
        }

        .coupon-code .code {
          width: 100%;
        }
      }
    `,
  ],
})
export class MyRedemptionsComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);

  // Signals
  redemptions = signal<LoyaltyRedemptionDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);

  // Filters
  selectedStatus = '';
  pageSize = 10;

  ngOnInit(): void {
    this.loadRedemptions();
  }

  /**
   * Cargar canjes del usuario
   */
  private loadRedemptions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService
      .getMyRedemptions({
        page: this.currentPage(),
        pageSize: this.pageSize,
        status: this.selectedStatus || undefined,
      })
      .subscribe({
        next: (response: PagedLoyaltyRedemptionsResponse) => {
          this.redemptions.set(response.items);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando canjes:', err);
          this.error.set(
            'No se pudieron cargar tus canjes. Por favor, intenta de nuevo.'
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
   * Formatear fecha corta
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  /**
   * Copiar código de cupón
   */
  copyCouponCode(code: string): void {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert('Código copiado al portapapeles');
      })
      .catch(() => {
        alert('No se pudo copiar el código');
      });
  }

  /**
   * Navegar al catálogo
   */
  navigateToCatalog(): void {
    globalThis.location.href = '/loyalty/rewards';
  }
}
