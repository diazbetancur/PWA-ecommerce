import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LoyaltyTransactionDto } from '../../models/loyalty.models';
import { LoyaltyTransactionsTableComponent } from '../loyalty-transactions-table/loyalty-transactions-table.component';

@Component({
  selector: 'lib-loyalty-transactions-preview',
  standalone: true,
  imports: [CommonModule, LoyaltyTransactionsTableComponent],
  templateUrl: './loyalty-transactions-preview.component.html',
  styleUrl: './loyalty-transactions-preview.component.scss',
})
export class LoyaltyTransactionsPreviewComponent {
  transactions = input<LoyaltyTransactionDto[]>([]);
  viewAll = output<void>();

  onViewAll(): void {
    this.viewAll.emit();
  }
}
