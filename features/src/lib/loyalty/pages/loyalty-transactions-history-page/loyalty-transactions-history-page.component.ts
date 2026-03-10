import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoyaltyTransactionsTableComponent } from '../../components/loyalty-transactions-table/loyalty-transactions-table.component';
import {
  LoyaltyTransactionDto,
  PagedLoyaltyTransactionsResponse,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'lib-loyalty-transactions-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoyaltyTransactionsTableComponent],
  templateUrl: './loyalty-transactions-history-page.component.html',
  styleUrl: './loyalty-transactions-history-page.component.scss',
})
export class LoyaltyTransactionsHistoryPageComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly router = inject(Router);

  readonly pageSize = 50;

  transactions = signal<LoyaltyTransactionDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  selectedType = signal('');

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService
      .getTransactions({
        page: this.currentPage(),
        pageSize: this.pageSize,
        type: this.selectedType() || undefined,
      })
      .subscribe({
        next: (response: PagedLoyaltyTransactionsResponse) => {
          this.transactions.set(response.items || []);
          this.totalPages.set(response.totalPages || 1);
          this.totalCount.set(response.totalCount ?? response.totalItems ?? 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar el historial de movimientos.');
          this.isLoading.set(false);
        },
      });
  }

  onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
    this.loadTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToSummary(): void {
    this.router.navigate(['/loyalty/account']);
  }
}
