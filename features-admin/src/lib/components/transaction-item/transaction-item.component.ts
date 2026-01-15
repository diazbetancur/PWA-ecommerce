import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyTransactionDto } from '../../models/loyalty.models';

/**
 * 📝 Componente de Item de Transacción
 *
 * Muestra un item individual de transacción de puntos.
 * Reutilizable en listas de historial y movimientos de puntos.
 */
@Component({
  selector: 'lib-transaction-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="transaction-item" [attr.data-type]="transaction.type">
      <!-- Icon -->
      <div class="transaction-icon">
        {{ getTransactionIcon() }}
      </div>

      <!-- Content -->
      <div class="transaction-content">
        <div class="transaction-header">
          <h4 class="transaction-description">{{ transaction.description }}</h4>
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
            {{ formatDate(transaction.createdAt) }}
          </span>

          <span class="meta-item">
            <span class="meta-icon">🏷️</span>
            {{ getTypeLabel() }}
          </span>

          @if (transaction.orderId) {
          <span class="meta-item">
            <span class="meta-icon">🛒</span>
            {{ transaction.orderId }}
          </span>
          } @if (transaction.redemptionId) {
          <span class="meta-item">
            <span class="meta-icon">🎟️</span>
            {{ transaction.redemptionId }}
          </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .transaction-item {
        display: flex;
        gap: 15px;
        padding: 15px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s, transform 0.2s;
      }

      .transaction-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(4px);
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
        min-width: 0;
      }

      .transaction-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 15px;
        margin-bottom: 8px;
      }

      .transaction-description {
        font-size: 1rem;
        font-weight: 600;
        color: #333;
        margin: 0;
        flex: 1;
        min-width: 0;
      }

      .transaction-points {
        font-size: 1.3rem;
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
        gap: 12px;
        font-size: 0.85rem;
        color: #6c757d;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .meta-icon {
        font-size: 0.95rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .transaction-item {
          flex-direction: column;
          gap: 12px;
        }

        .transaction-icon {
          align-self: center;
        }

        .transaction-header {
          flex-direction: column;
          gap: 8px;
        }

        .transaction-meta {
          flex-direction: column;
          gap: 6px;
        }
      }
    `,
  ],
})
export class TransactionItemComponent {
  @Input({ required: true }) transaction!: LoyaltyTransactionDto;

  getTransactionIcon(): string {
    const icons: Record<string, string> = {
      EARNED: '⬆️',
      REDEEMED: '⬇️',
      EXPIRED: '⏰',
      ADJUSTED: '⚙️',
    };
    return icons[this.transaction.type] || '📝';
  }

  getTypeLabel(): string {
    const labels: Record<string, string> = {
      EARNED: 'Ganados',
      REDEEMED: 'Canjeados',
      EXPIRED: 'Expirados',
      ADJUSTED: 'Ajuste',
    };
    return labels[this.transaction.type] || this.transaction.type;
  }

  formatDate(dateString: string): string {
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
