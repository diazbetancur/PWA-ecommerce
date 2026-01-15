import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TIER_COLORS, TIER_LABELS } from '../../models/loyalty.models';

/**
 * 🏅 Componente de Badge de Tier
 *
 * Muestra el nivel/tier del usuario con estilo visual distintivo.
 * Puede usarse en perfiles, listas de usuarios, o cualquier lugar que requiera mostrar el tier.
 */
@Component({
  selector: 'lib-tier-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="tier-badge"
      [class.large]="size === 'large'"
      [class.small]="size === 'small'"
      [style.background-color]="getTierColor()"
      [attr.data-tier]="tier"
    >
      @if (showIcon) {
      <span class="tier-icon">{{ getTierIcon() }}</span>
      }
      <span class="tier-label">{{ getTierLabel() }}</span>
    </div>
  `,
  styles: [
    `
      .tier-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        border-radius: 20px;
        color: white;
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s;
      }

      .tier-badge:hover {
        transform: scale(1.05);
      }

      .tier-badge.large {
        padding: 10px 24px;
        font-size: 1rem;
        gap: 8px;
      }

      .tier-badge.small {
        padding: 4px 12px;
        font-size: 0.75rem;
        gap: 4px;
      }

      .tier-icon {
        font-size: 1.2rem;
        line-height: 1;
      }

      .tier-badge.large .tier-icon {
        font-size: 1.5rem;
      }

      .tier-badge.small .tier-icon {
        font-size: 1rem;
      }

      .tier-label {
        line-height: 1;
      }

      /* Tier-specific styles */
      .tier-badge[data-tier='BRONZE'] {
        box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
      }

      .tier-badge[data-tier='SILVER'] {
        box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
      }

      .tier-badge[data-tier='GOLD'] {
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
      }

      .tier-badge[data-tier='PLATINUM'] {
        box-shadow: 0 2px 8px rgba(229, 228, 226, 0.4);
      }
    `,
  ],
})
export class TierBadgeComponent {
  @Input({ required: true }) tier!: string;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() showIcon = true;

  getTierLabel(): string {
    return TIER_LABELS[this.tier] || this.tier;
  }

  getTierColor(): string {
    return TIER_COLORS[this.tier] || '#6c757d';
  }

  getTierIcon(): string {
    const icons: Record<string, string> = {
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇',
      PLATINUM: '💎',
    };
    return icons[this.tier] || '🏅';
  }
}
