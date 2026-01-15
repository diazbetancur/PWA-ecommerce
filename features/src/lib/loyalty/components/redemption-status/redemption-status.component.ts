import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  REDEMPTION_STATUS_LABELS,
  REDEMPTION_STATUS_COLORS,
} from '../../models/loyalty.models';

/**
 * 🎟️ Componente de Badge de Estado de Canje
 *
 * Muestra el estado de un canje de premio con colores distintivos.
 * Reutilizable en listas de canjes y detalles de canjes.
 */
@Component({
  selector: 'lib-redemption-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="redemption-status"
      [class.large]="size === 'large'"
      [class.small]="size === 'small'"
      [attr.data-status]="getStatusColor()"
    >
      @if (showIcon) {
      <span class="status-icon">{{ getStatusIcon() }}</span>
      }
      <span class="status-label">{{ getStatusLabel() }}</span>
    </span>
  `,
  styles: [
    `
      .redemption-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
        transition: transform 0.2s;
      }

      .redemption-status:hover {
        transform: scale(1.05);
      }

      .redemption-status.large {
        padding: 10px 20px;
        font-size: 1rem;
        gap: 8px;
        border-radius: 20px;
      }

      .redemption-status.small {
        padding: 4px 10px;
        font-size: 0.75rem;
        gap: 4px;
        border-radius: 12px;
      }

      .status-icon {
        font-size: 1rem;
        line-height: 1;
      }

      .redemption-status.large .status-icon {
        font-size: 1.3rem;
      }

      .redemption-status.small .status-icon {
        font-size: 0.9rem;
      }

      .status-label {
        line-height: 1;
      }

      /* Status Colors */
      .redemption-status[data-status='warning'] {
        background: #ffc107;
        color: #000;
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
      }

      .redemption-status[data-status='success'] {
        background: #28a745;
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      }

      .redemption-status[data-status='info'] {
        background: #17a2b8;
        box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
      }

      .redemption-status[data-status='danger'] {
        background: #dc3545;
        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
      }

      .redemption-status[data-status='secondary'] {
        background: #6c757d;
        box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
      }
    `,
  ],
})
export class RedemptionStatusComponent {
  @Input({ required: true }) status!: string;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() showIcon = true;

  getStatusLabel(): string {
    return REDEMPTION_STATUS_LABELS[this.status] || this.status;
  }

  getStatusColor(): string {
    return REDEMPTION_STATUS_COLORS[this.status] || 'secondary';
  }

  getStatusIcon(): string {
    const icons: Record<string, string> = {
      PENDING: '⏳',
      APPROVED: '✓',
      DELIVERED: '📦',
      CANCELLED: '✕',
      EXPIRED: '⏰',
    };
    return icons[this.status] || '📋';
  }
}
