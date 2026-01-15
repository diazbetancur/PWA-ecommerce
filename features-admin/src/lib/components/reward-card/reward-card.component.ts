import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LoyaltyRewardDto,
  REWARD_TYPE_LABELS,
} from '../../models/loyalty.models';

/**
 * 🎁 Componente de Tarjeta de Premio
 *
 * Tarjeta reutilizable para mostrar información de un premio.
 * Puede usarse en catálogos, listas, o cualquier vista de premios.
 */
@Component({
  selector: 'lib-reward-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reward-card" [class.disabled]="disabled">
      <!-- Image -->
      <div class="reward-image">
        @if (reward.imageUrl) {
        <img [src]="reward.imageUrl" [alt]="reward.name" />
        } @else {
        <div class="placeholder-image">
          {{ getRewardIcon() }}
        </div>
        }

        <!-- Badges -->
        @if (!reward.isActive) {
        <div class="status-badge inactive">Inactivo</div>
        } @if (isOutOfStock()) {
        <div class="status-badge out-of-stock">Agotado</div>
        } @else if (isLowStock()) {
        <div class="status-badge low-stock">¡Pocas unidades!</div>
        }
      </div>

      <!-- Content -->
      <div class="reward-content">
        <div class="reward-type-badge">
          {{ getRewardTypeLabel() }}
        </div>

        <h3 class="reward-name">{{ reward.name }}</h3>

        <p class="reward-description">
          {{ truncateDescription(reward.description) }}
        </p>

        <!-- Value -->
        @if (reward.discountValue) {
        <div class="reward-value">
          @if (reward.rewardType === 'DISCOUNT_PERCENTAGE') {
          <strong>{{ reward.discountValue }}%</strong> de descuento } @else {
          <strong>{{ reward.discountValue | currency }}</strong> de descuento }
        </div>
        }

        <!-- Points Cost -->
        <div class="points-cost">
          <span class="icon">💎</span>
          <span class="cost">{{ reward.pointsCost | number : '1.0-0' }}</span>
          <span class="label">puntos</span>
        </div>

        <!-- Actions -->
        @if (showActions) {
        <div class="card-actions">
          <button
            class="btn-primary"
            [disabled]="disabled || isOutOfStock()"
            (click)="onActionClick()"
          >
            {{ actionLabel }}
          </button>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .reward-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .reward-card:hover:not(.disabled) {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .reward-card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .reward-image {
        position: relative;
        height: 200px;
        background: #f8f9fa;
        overflow: hidden;
      }

      .reward-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .status-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
      }

      .status-badge.inactive {
        background: #6c757d;
      }

      .status-badge.out-of-stock {
        background: #dc3545;
      }

      .status-badge.low-stock {
        background: #ffc107;
        color: #000;
      }

      .reward-content {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .reward-type-badge {
        display: inline-block;
        width: fit-content;
        padding: 4px 12px;
        background: #e7f3ff;
        color: #0056b3;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .reward-name {
        font-size: 1.2rem;
        color: #333;
        margin: 0;
        line-height: 1.3;
      }

      .reward-description {
        font-size: 0.9rem;
        color: #6c757d;
        line-height: 1.5;
        margin: 0;
        flex: 1;
      }

      .reward-value {
        padding: 10px;
        background: #e7f3ff;
        border-radius: 8px;
        color: #0056b3;
        font-size: 0.9rem;
        text-align: center;
      }

      .reward-value strong {
        font-size: 1.1rem;
      }

      .points-cost {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: white;
      }

      .points-cost .icon {
        font-size: 1.3rem;
      }

      .points-cost .cost {
        font-size: 1.5rem;
        font-weight: bold;
      }

      .points-cost .label {
        font-size: 0.85rem;
        opacity: 0.9;
      }

      .card-actions {
        margin-top: auto;
      }

      .btn-primary {
        width: 100%;
        padding: 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-primary:hover:not(:disabled) {
        background: #0056b3;
      }

      .btn-primary:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
    `,
  ],
})
export class RewardCardComponent {
  @Input({ required: true }) reward!: LoyaltyRewardDto;
  @Input() showActions = true;
  @Input() actionLabel = 'Canjear';
  @Input() disabled = false;
  @Output() actionClick = new EventEmitter<LoyaltyRewardDto>();

  getRewardTypeLabel(): string {
    return REWARD_TYPE_LABELS[this.reward.rewardType] || this.reward.rewardType;
  }

  getRewardIcon(): string {
    const icons: Record<string, string> = {
      PRODUCT: '📦',
      DISCOUNT_PERCENTAGE: '🏷️',
      DISCOUNT_FIXED: '💵',
      FREE_SHIPPING: '🚚',
    };
    return icons[this.reward.rewardType] || '🎁';
  }

  isOutOfStock(): boolean {
    return (
      this.reward.stock !== null &&
      this.reward.stock !== undefined &&
      this.reward.stock <= 0
    );
  }

  isLowStock(): boolean {
    return (
      this.reward.stock !== null &&
      this.reward.stock !== undefined &&
      this.reward.stock > 0 &&
      this.reward.stock <= 5
    );
  }

  truncateDescription(desc: string): string {
    return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
  }

  onActionClick(): void {
    if (!this.disabled && !this.isOutOfStock()) {
      this.actionClick.emit(this.reward);
    }
  }
}
