import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TIER_COLORS, TIER_LABELS } from '../../models/loyalty.models';

/**
 * 💎 Componente de Balance de Puntos
 *
 * Muestra el balance actual de puntos del usuario con estilo visual atractivo.
 * Puede usarse en dashboard, header, o cualquier lugar que requiera mostrar puntos.
 */
@Component({
  selector: 'lib-loyalty-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="loyalty-balance"
      [class.compact]="compact"
      [class.large]="size === 'large'"
    >
      <div class="balance-icon">💎</div>
      <div class="balance-content">
        @if (showLabel) {
        <div class="balance-label">{{ label }}</div>
        }
        <div class="balance-value">{{ points | number : '1.0-0' }}</div>
        @if (showTier && tier) {
        <div class="balance-tier" [style.color]="getTierColor()">
          {{ getTierLabel() }}
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .loyalty-balance {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .loyalty-balance.compact {
        padding: 10px;
        gap: 8px;
      }

      .loyalty-balance.large {
        padding: 25px;
        gap: 18px;
      }

      .balance-icon {
        font-size: 2.5rem;
        flex-shrink: 0;
      }

      .loyalty-balance.compact .balance-icon {
        font-size: 1.8rem;
      }

      .loyalty-balance.large .balance-icon {
        font-size: 3.5rem;
      }

      .balance-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .balance-label {
        font-size: 0.85rem;
        opacity: 0.9;
        font-weight: 500;
      }

      .loyalty-balance.large .balance-label {
        font-size: 1rem;
      }

      .balance-value {
        font-size: 2rem;
        font-weight: bold;
        line-height: 1;
      }

      .loyalty-balance.compact .balance-value {
        font-size: 1.5rem;
      }

      .loyalty-balance.large .balance-value {
        font-size: 3rem;
      }

      .balance-tier {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
      }

      .loyalty-balance.large .balance-tier {
        font-size: 1rem;
      }
    `,
  ],
})
export class LoyaltyBalanceComponent {
  @Input() points = 0;
  @Input() tier?: string;
  @Input() showLabel = true;
  @Input() showTier = true;
  @Input() label = 'Puntos Disponibles';
  @Input() compact = false;
  @Input() size: 'normal' | 'large' = 'normal';

  getTierLabel(): string {
    if (!this.tier) return '';
    return TIER_LABELS[this.tier] || this.tier;
  }

  getTierColor(): string {
    if (!this.tier) return '#FFD700';
    return TIER_COLORS[this.tier] || '#FFD700';
  }
}
