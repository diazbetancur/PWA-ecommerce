import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-loyalty-transaction-type-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span
    class="type-badge"
    [class]="'type-badge type-badge--' + getVariant()"
    >{{ getLabel() }}</span
  >`,
  styles: [
    `
      .type-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .type-badge--earn {
        color: #0f7a2e;
        background: #e8f8ed;
      }

      .type-badge--redeem {
        color: #8f1f23;
        background: #fdecec;
      }

      .type-badge--expire {
        color: #8a5b00;
        background: #fff4d8;
      }

      .type-badge--adjust {
        color: #334155;
        background: #eef2f7;
      }
    `,
  ],
})
export class LoyaltyTransactionTypeBadgeComponent {
  type = input.required<string>();

  private normalize(type: string): 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' {
    const upper = (type || '').toUpperCase();
    if (upper === 'EARN' || upper === 'EARNED') return 'EARN';
    if (upper === 'REDEEM' || upper === 'REDEEMED') return 'REDEEM';
    if (upper === 'EXPIRE' || upper === 'EXPIRED') return 'EXPIRE';
    return 'ADJUST';
  }

  getVariant(): string {
    const normalized = this.normalize(this.type());
    return normalized.toLowerCase();
  }

  getLabel(): string {
    const normalized = this.normalize(this.type());
    const labels: Record<string, string> = {
      EARN: 'Acumulación',
      REDEEM: 'Redención',
      EXPIRE: 'Vencimiento',
      ADJUST: 'Ajuste',
    };
    return labels[normalized];
  }
}
