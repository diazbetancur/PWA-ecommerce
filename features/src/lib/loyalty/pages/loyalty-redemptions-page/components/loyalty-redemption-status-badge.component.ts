import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { REDEMPTION_STATUS_LABELS } from '../../../models/loyalty.models';

@Component({
  selector: 'lib-loyalty-redemption-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status-badge" [attr.data-status]="normalizedStatus()">{{
    statusLabel()
  }}</span>`,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0.25rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.01em;
      }

      .status-badge[data-status='PENDING'] {
        background: color-mix(in oklab, var(--tenant-secondary-color, #64748b) 18%, transparent);
        color: var(--tenant-secondary-color, #64748b);
      }

      .status-badge[data-status='APPROVED'] {
        background: color-mix(in oklab, var(--tenant-primary-color, #2563eb) 14%, transparent);
        color: var(--tenant-primary-color, #2563eb);
      }

      .status-badge[data-status='DELIVERED'] {
        background: color-mix(in oklab, var(--tenant-text-color, #1f2937) 12%, transparent);
        color: var(--tenant-text-color, #1f2937);
      }

      .status-badge[data-status='CANCELLED'],
      .status-badge[data-status='EXPIRED'] {
        background: color-mix(in oklab, var(--tenant-accent-color, #ef4444) 12%, transparent);
        color: var(--tenant-accent-color, #ef4444);
      }
    `,
  ],
})
export class LoyaltyRedemptionStatusBadgeComponent {
  readonly status = input.required<string>();

  normalizedStatus(): string {
    return (this.status() || '').toUpperCase();
  }

  statusLabel(): string {
    const normalized = this.normalizedStatus();
    return REDEMPTION_STATUS_LABELS[normalized] || normalized;
  }
}
