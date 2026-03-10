import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import {
  PointsAdjustment,
  PointsAdjustmentFilters,
  PointsAdjustmentResponse,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';
import { LoyaltyAdjustmentDetailModalComponent } from './components/loyalty-adjustment-detail-modal.component';
import {
  LoyaltyAdjustmentsFilterValues,
  LoyaltyAdjustmentsFiltersComponent,
} from './components/loyalty-adjustments-filters.component';
import { LoyaltyAdjustmentsTableComponent } from './components/loyalty-adjustments-table.component';

@Component({
  selector: 'lib-loyalty-points-adjustments-page',
  standalone: true,
  imports: [
    CommonModule,
    LoyaltyAdjustmentsFiltersComponent,
    LoyaltyAdjustmentsTableComponent,
    LoyaltyAdjustmentDetailModalComponent,
  ],
  templateUrl: './loyalty-points-adjustments-page.component.html',
  styleUrl: './loyalty-points-adjustments-page.component.scss',
})
export class LoyaltyPointsAdjustmentsPageComponent implements OnInit {
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadTrigger$ = new Subject<void>();

  readonly adjustments = signal<PointsAdjustment[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedAdjustment = signal<PointsAdjustment | null>(null);

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);

  readonly activeFilters = signal<
    Omit<PointsAdjustmentFilters, 'page' | 'pageSize'>
  >({});

  ngOnInit(): void {
    this.loadTrigger$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.loyaltyAdminService
            .listPointsAdjustments(this.buildRequest())
            .pipe(
              catchError(() => {
                this.error.set('No se pudieron cargar los ajustes de puntos.');
                return of<PointsAdjustmentResponse>({
                  items: [],
                  totalCount: 0,
                  page: this.currentPage(),
                  pageSize: this.pageSize(),
                  totalPages: 1,
                });
              })
            )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.adjustments.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages || 1);
        this.currentPage.set(response.page || 1);
        this.pageSize.set(response.pageSize || this.pageSize());
        this.isLoading.set(false);
      });

    this.reload();
  }

  onApplyFilters(filters: LoyaltyAdjustmentsFilterValues): void {
    this.activeFilters.set({
      search: filters.search,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
    this.currentPage.set(1);
    this.reload();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.reload();
  }

  onViewDetail(adjustment: PointsAdjustment): void {
    this.selectedAdjustment.set(adjustment);
  }

  closeDetailModal(): void {
    this.selectedAdjustment.set(null);
  }

  goToMakeAdjustment(): void {
    this.router.navigate(['/tenant-admin/loyalty/points-adjustment']);
  }

  private reload(): void {
    this.loadTrigger$.next();
  }

  private buildRequest(): PointsAdjustmentFilters {
    const filters = this.activeFilters();

    return {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: filters.search,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
  }
}
