import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PointsAdjustment } from '../../../../models/loyalty.models';

@Component({
  selector: 'lib-loyalty-adjustments-table',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './loyalty-adjustments-table.component.html',
  styleUrl: './loyalty-adjustments-table.component.scss',
})
export class LoyaltyAdjustmentsTableComponent {
  @Input() items: PointsAdjustment[] = [];
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalCount = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() viewDetail = new EventEmitter<PointsAdjustment>();

  goToPreviousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.pageChange.emit(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.pageChange.emit(this.currentPage + 1);
  }

  getTransactionTypeLabel(transactionType: string): string {
    if (transactionType === 'ADJUST') {
      return 'Ajuste';
    }
    return transactionType;
  }
}
