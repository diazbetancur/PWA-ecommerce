import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  LoyaltyRedemptionsFilters,
  LoyaltyRedemptionsResponse,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';
import { LoyaltyRedemptionsFiltersComponent } from './components/loyalty-redemptions-filters.component';
import { LoyaltyRedemptionsTableComponent } from './components/loyalty-redemptions-table.component';

@Component({
  selector: 'lib-loyalty-redemptions-page',
  standalone: true,
  imports: [
    CommonModule,
    LoyaltyRedemptionsFiltersComponent,
    LoyaltyRedemptionsTableComponent,
  ],
  templateUrl: './loyalty-redemptions-page.component.html',
  styleUrl: './loyalty-redemptions-page.component.scss',
})
export class LoyaltyRedemptionsPageComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);

  readonly redemptions = signal<LoyaltyRedemptionsResponse['items']>([]);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);

  readonly activeFilters = signal<
    Pick<LoyaltyRedemptionsFilters, 'status' | 'fromDate' | 'toDate'>
  >({});

  readonly hasItems = computed(() => this.redemptions().length > 0);
  readonly showPagination = computed(() => this.totalPages() > 1);

  ngOnInit(): void {
    this.loadRedemptions();
  }

  onApplyFilters(
    filters: Pick<LoyaltyRedemptionsFilters, 'status' | 'fromDate' | 'toDate'>
  ): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadRedemptions();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
    this.loadRedemptions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadRedemptions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService.getRedemptions(this.buildParams()).subscribe({
      next: (response) => {
        this.redemptions.set(response.items || []);
        this.currentPage.set(response.page || 1);
        this.pageSize.set(response.pageSize || this.pageSize());
        this.totalPages.set(response.totalPages || 1);
        this.totalCount.set(response.totalCount ?? response.totalItems ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(
          'No pudimos cargar tus premios redimidos. Intenta de nuevo.'
        );
        this.redemptions.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private buildParams(): LoyaltyRedemptionsFilters {
    const filters = this.activeFilters();

    return {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
  }
}
