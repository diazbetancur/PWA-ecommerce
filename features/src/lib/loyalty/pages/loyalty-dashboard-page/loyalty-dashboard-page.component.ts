import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoyaltySummaryCardComponent } from '../../components/loyalty-summary-card/loyalty-summary-card.component';
import { LoyaltyTransactionsPreviewComponent } from '../../components/loyalty-transactions-preview/loyalty-transactions-preview.component';
import { LoyaltyAccountSummaryDto } from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'lib-loyalty-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    LoyaltySummaryCardComponent,
    LoyaltyTransactionsPreviewComponent,
  ],
  templateUrl: './loyalty-dashboard-page.component.html',
  styleUrl: './loyalty-dashboard-page.component.scss',
})
export class LoyaltyDashboardPageComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly router = inject(Router);

  dashboard = signal<LoyaltyAccountSummaryDto | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  lastTransactions = computed(
    () => this.dashboard()?.lastTransactions?.slice(0, 5) ?? []
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService.getDashboard().subscribe({
      next: (response) => {
        this.dashboard.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(
          'No pudimos cargar tu resumen de lealtad. Intenta de nuevo.'
        );
        this.isLoading.set(false);
      },
    });
  }

  goToHistory(): void {
    this.router.navigate(['/loyalty/transactions']);
  }
}
