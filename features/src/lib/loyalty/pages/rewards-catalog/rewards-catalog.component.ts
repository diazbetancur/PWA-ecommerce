import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '@pwa/core';
import { TenantAuthModalService } from '@pwa/features-account';
import { extractApiErrorMessage, ToastService } from '@pwa/shared';
import {
  LoyaltyRewardDto,
  PagedLoyaltyRewardsResponse,
  REWARD_TYPE_LABELS,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'lib-rewards-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rewards-catalog.component.html',
  styleUrl: './rewards-catalog.component.scss',
})
export class RewardsCatalogComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly authService = inject(AuthService);
  private readonly tenantAuthModal = inject(TenantAuthModalService);
  private readonly toastService = inject(ToastService);

  readonly rewards = signal<LoyaltyRewardDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);

  readonly selectedReward = signal<LoyaltyRewardDto | null>(null);
  readonly redeemingRewardId = signal<string | null>(null);
  readonly pendingRewardAfterLogin = signal<{
    reward: LoyaltyRewardDto;
    reopenDetail: boolean;
  } | null>(null);

  readonly pageSize = 20;

  readonly canShowPagination = computed(() => this.totalPages() > 1);

  ngOnInit(): void {
    this.loadRewards();
  }

  loadRewards(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService
      .getAvailableRewards({
        page: this.currentPage(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response: PagedLoyaltyRewardsResponse) => {
          this.rewards.set(response.items || []);
          this.totalPages.set(response.totalPages || 1);
          this.totalItems.set(response.totalCount ?? response.totalItems ?? 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set(
            'No se pudieron cargar los premios. Intenta de nuevo.'
          );
          this.isLoading.set(false);
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
    this.loadRewards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openDetail(reward: LoyaltyRewardDto): void {
    this.selectedReward.set(reward);
  }

  closeDetail(): void {
    this.selectedReward.set(null);
  }

  stopModalClose(event: Event): void {
    event.stopPropagation();
  }

  onBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.closeDetail();
    }
  }

  onModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDetail();
    }
  }

  redeemFromCard(reward: LoyaltyRewardDto): void {
    this.redeemReward(reward, false);
  }

  redeemFromModal(): void {
    const reward = this.selectedReward();
    if (!reward) {
      return;
    }

    this.redeemReward(reward, true);
  }

  private redeemReward(
    reward: LoyaltyRewardDto,
    closeModalOnSuccess: boolean
  ): void {
    if (!this.authService.isAuthenticated()) {
      if (closeModalOnSuccess) {
        this.closeDetail();
      }

      this.pendingRewardAfterLogin.set({
        reward,
        reopenDetail: closeModalOnSuccess,
      });

      this.tenantAuthModal
        .open('login', { redirectAfterAuth: false })
        .afterClosed()
        .subscribe(() => {
          const pending = this.pendingRewardAfterLogin();
          this.pendingRewardAfterLogin.set(null);

          if (!pending || !this.authService.isAuthenticated()) {
            return;
          }

          if (pending.reopenDetail) {
            this.openDetail(pending.reward);
          }
        });

      return;
    }

    if (!this.isRewardRedeemable(reward)) {
      return;
    }

    this.redeemingRewardId.set(reward.id);

    this.loyaltyService.redeemReward(reward.id).subscribe({
      next: (response) => {
        const couponPart = response.couponCode
          ? ` Código: ${response.couponCode}.`
          : '';
        const expiresPart = response.expiresAt
          ? ` Vence: ${this.formatDateTime(response.expiresAt)}.`
          : '';

        this.toastService.success(
          `${
            response.message || 'Premio redimido correctamente.'
          }${couponPart}${expiresPart}`
        );

        this.redeemingRewardId.set(null);
        if (closeModalOnSuccess) {
          this.closeDetail();
        }
        this.loadRewards();
      },
      error: (error) => {
        this.toastService.error(extractApiErrorMessage(error));
        this.redeemingRewardId.set(null);
      },
    });
  }

  isRewardRedeemable(reward: LoyaltyRewardDto): boolean {
    if (reward.isActive === false) {
      return false;
    }

    if (typeof reward.isCurrentlyAvailable === 'boolean') {
      return reward.isCurrentlyAvailable;
    }

    if (reward.stock === null || reward.stock === undefined) {
      return true;
    }

    return reward.stock > 0;
  }

  isRedeeming(rewardId: string): boolean {
    return this.redeemingRewardId() === rewardId;
  }

  getRewardTypeLabel(type: string): string {
    return REWARD_TYPE_LABELS[type] || type;
  }

  getPreviewDescription(reward: LoyaltyRewardDto): string {
    if (reward.description?.trim()) {
      return reward.description;
    }

    if (reward.rewardType === 'DISCOUNT_PERCENTAGE' && reward.discountValue) {
      return `Descuento del ${reward.discountValue}% en productos elegibles.`;
    }

    if (reward.rewardType === 'DISCOUNT_FIXED' && reward.discountValue) {
      return `Descuento fijo de ${reward.discountValue} aplicado en tu compra.`;
    }

    return 'Premio disponible para redimir con tus puntos.';
  }

  getDiscountDetail(reward: LoyaltyRewardDto): string {
    if (!reward.discountValue) {
      return 'No aplica';
    }

    if (reward.rewardType === 'DISCOUNT_PERCENTAGE') {
      return `${reward.discountValue}%`;
    }

    if (reward.rewardType === 'DISCOUNT_FIXED') {
      return `${reward.discountValue}`;
    }

    return 'No aplica';
  }

  formatDateTime(value?: string | null): string {
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
}
