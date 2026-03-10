import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import {
  LoyaltyRedemptionItem,
  REWARD_TYPE_LABELS,
} from '../../../models/loyalty.models';
import { LoyaltyRedemptionStatusBadgeComponent } from './loyalty-redemption-status-badge.component';

@Component({
  selector: 'lib-loyalty-redemptions-table',
  standalone: true,
  imports: [CommonModule, LoyaltyRedemptionStatusBadgeComponent],
  templateUrl: './loyalty-redemptions-table.component.html',
  styleUrl: './loyalty-redemptions-table.component.scss',
})
export class LoyaltyRedemptionsTableComponent {
  readonly items = input<LoyaltyRedemptionItem[]>([]);

  getRewardTypeLabel(type: string): string {
    return REWARD_TYPE_LABELS[type] || type;
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return 'No aplica';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'No aplica';
    }

    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatRedeemedDate(value?: string | null): string {
    if (!value) {
      return 'No aplica';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'No aplica';
    }

    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  couponCodeValue(value?: string | null): string {
    return value?.trim() ? value : 'No aplica';
  }

  deliveredAtValue(value?: string | null): string {
    return value ? this.formatDate(value) : 'Pendiente';
  }

  orderNumberValue(value?: string | null): string {
    return value?.trim() ? value : 'Sin pedido asociado';
  }
}
