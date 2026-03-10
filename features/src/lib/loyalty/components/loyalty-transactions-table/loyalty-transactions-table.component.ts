import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { LoyaltyTransactionDto } from '../../models/loyalty.models';
import { LoyaltyTransactionTypeBadgeComponent } from '../loyalty-transaction-type-badge/loyalty-transaction-type-badge.component';

@Component({
  selector: 'lib-loyalty-transactions-table',
  standalone: true,
  imports: [CommonModule, LoyaltyTransactionTypeBadgeComponent],
  templateUrl: './loyalty-transactions-table.component.html',
  styleUrl: './loyalty-transactions-table.component.scss',
})
export class LoyaltyTransactionsTableComponent {
  transactions = input<LoyaltyTransactionDto[]>([]);
  emptyMessage = input('Aún no tienes movimientos de puntos');

  formatPoints(value: number): string {
    const absValue = Math.abs(value || 0);
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${new Intl.NumberFormat('es-CO').format(absValue)}`;
  }

  getPointClass(value: number): string {
    return value >= 0 ? 'points-positive' : 'points-negative';
  }

  formatDate(dateValue?: string | null): string {
    if (!dateValue) {
      return 'No aplica';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return 'No aplica';
    }

    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getTransactionDate(transaction: LoyaltyTransactionDto): string {
    return transaction.transactionDate || transaction.createdAt;
  }

  getDetail(transaction: LoyaltyTransactionDto): string {
    return transaction.detail || transaction.description || '-';
  }
}
