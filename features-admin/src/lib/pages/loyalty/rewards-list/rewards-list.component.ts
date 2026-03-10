import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationDialogService, ToastService } from '@pwa/shared';
import {
  GetLoyaltyRewardsQuery,
  LoyaltyRewardDto,
  PagedLoyaltyRewardsResponse,
  REWARD_TYPE_LABELS,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';

@Component({
  selector: 'lib-rewards-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rewards-list.component.html',
  styleUrl: './rewards-list.component.scss',
})
export class RewardsListComponent implements OnInit {
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  rewards = signal<LoyaltyRewardDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  showAdvancedFilters = signal(false);

  selectedType = '';
  selectedStatus = '';
  selectedAvailability = '';
  searchTerm = '';
  availableFrom = '';
  availableUntil = '';
  createdFrom = '';
  createdTo = '';
  pageSize = 20;

  ngOnInit(): void {
    this.loadRewards();
  }

  private loadRewards(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const query: GetLoyaltyRewardsQuery = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      isActive:
        this.selectedStatus === '' ? undefined : this.selectedStatus === 'true',
      rewardType: this.selectedType || undefined,
      search: this.searchTerm.trim() || undefined,
      availableFrom: this.toIsoStart(this.availableFrom),
      availableUntil: this.toIsoEnd(this.availableUntil),
      createdFrom: this.toIsoStart(this.createdFrom),
      createdTo: this.toIsoEnd(this.createdTo),
      isCurrentlyAvailable:
        this.selectedAvailability === ''
          ? undefined
          : this.selectedAvailability === 'true',
    };

    this.loyaltyAdminService.listRewards(query).subscribe({
      next: (response: PagedLoyaltyRewardsResponse) => {
        this.rewards.set(response.items || []);

        const total =
          response.totalItems ??
          response.totalCount ??
          response.items?.length ??
          0;
        this.totalItems.set(total);

        if (response.totalPages && response.totalPages > 0) {
          this.totalPages.set(response.totalPages);
        } else {
          this.totalPages.set(Math.max(1, Math.ceil(total / this.pageSize)));
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(
          'No se pudieron cargar los premios. Intenta nuevamente.'
        );
        this.isLoading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadRewards();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadRewards();
  }

  search(): void {
    this.onSearchChange();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update((value) => !value);
  }

  clearFilters(): void {
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedAvailability = '';
    this.searchTerm = '';
    this.availableFrom = '';
    this.availableUntil = '';
    this.createdFrom = '';
    this.createdTo = '';
    this.currentPage.set(1);
    this.loadRewards();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadRewards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getRewardTypeLabel(type: string): string {
    return REWARD_TYPE_LABELS[type] || type;
  }

  getCouponQuantityLabel(reward: LoyaltyRewardDto): string {
    const quantity = reward.couponQuantity ?? reward.stock;

    if (quantity === null || quantity === undefined) {
      return 'Ilimitado';
    }

    if (quantity === 0) {
      return '0';
    }

    return `${quantity}`;
  }

  getAvailabilityLabel(reward: LoyaltyRewardDto): string {
    const available = this.isCurrentlyAvailable(reward);
    return available ? 'Disponible ahora' : 'No disponible';
  }

  isCurrentlyAvailable(reward: LoyaltyRewardDto): boolean {
    if (typeof reward.isCurrentlyAvailable === 'boolean') {
      return reward.isCurrentlyAvailable;
    }

    if (!reward.isActive) {
      return false;
    }

    const now = Date.now();
    const from = reward.availableFrom
      ? new Date(reward.availableFrom).getTime()
      : null;
    const until = reward.availableUntil
      ? new Date(reward.availableUntil).getTime()
      : null;

    if (from !== null && now < from) {
      return false;
    }

    if (until !== null && now > until) {
      return false;
    }

    return true;
  }

  createReward(): void {
    this.router.navigate(['/tenant-admin/loyalty/rewards/new']);
  }

  editReward(reward: LoyaltyRewardDto): void {
    this.router.navigate(['/tenant-admin/loyalty/rewards', reward.id, 'edit']);
  }

  deleteReward(reward: LoyaltyRewardDto): void {
    this.confirmationDialog
      .confirmDelete(
        reward.name,
        'Si el premio tiene canjes, el backend aplicará desactivación (soft delete).'
      )
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.loyaltyAdminService.deleteReward(reward.id).subscribe({
          next: () => {
            this.toastService.success(
              'Premio eliminado/desactivado correctamente'
            );
            this.loadRewards();
          },
          error: () => {
            this.toastService.error('No se pudo eliminar el premio');
          },
        });
      });
  }

  trackByRewardId(_: number, reward: LoyaltyRewardDto): string {
    return reward.id;
  }

  private toIsoStart(dateValue: string): string | undefined {
    if (!dateValue) {
      return undefined;
    }

    return `${dateValue}T00:00:00Z`;
  }

  private toIsoEnd(dateValue: string): string | undefined {
    if (!dateValue) {
      return undefined;
    }

    return `${dateValue}T23:59:59Z`;
  }
}
