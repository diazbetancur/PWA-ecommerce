import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LoyaltyRewardDto,
  PagedLoyaltyRewardsResponse,
  REWARD_TYPE_LABELS,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

/**
 * 🎁 Catálogo de Premios de Lealtad
 *
 * Muestra todos los premios disponibles para canjear.
 * Incluye:
 * - Filtros por tipo de premio
 * - Ordenamiento por puntos
 * - Información de disponibilidad (stock)
 * - Botón para canjear premio
 */
@Component({
  selector: 'app-rewards-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rewards-catalog.component.html',
  styles: [
    `
      .rewards-catalog-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .page-header h1 {
        font-size: 2rem;
        color: var(--primary-color, #007bff);
        margin-bottom: 10px;
      }

      .page-header p {
        color: #6c757d;
      }

      /* Filters */
      .filters-section {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      }

      .filter-group {
        flex: 1;
        min-width: 200px;
      }

      .filter-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-select {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-select:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
      }

      /* Loading & Errors */
      .loading-container {
        text-align: center;
        padding: 60px 20px;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-color, #007bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .alert {
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .alert-danger {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      /* Rewards Grid */
      .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 25px;
        margin-bottom: 30px;
      }

      .reward-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
      }

      .reward-card:hover:not(.out-of-stock) {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .reward-card.out-of-stock {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Reward Image */
      .reward-image {
        position: relative;
        height: 200px;
        background: #f8f9fa;
        overflow: hidden;
      }

      .reward-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .stock-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }

      .stock-badge.out {
        background-color: #dc3545;
      }

      .stock-badge.low {
        background-color: #ffc107;
        color: #000;
      }

      .type-badge {
        position: absolute;
        bottom: 10px;
        left: 10px;
        padding: 6px 12px;
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
      }

      /* Reward Content */
      .reward-content {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .reward-name {
        font-size: 1.3rem;
        margin-bottom: 10px;
        color: #333;
      }

      .reward-description {
        font-size: 0.9rem;
        color: #6c757d;
        margin-bottom: 15px;
        line-height: 1.5;
        flex: 1;
      }

      .reward-value {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 15px;
        padding: 10px;
        background: #e7f3ff;
        border-radius: 8px;
      }

      .reward-value .value-icon {
        font-size: 1.2rem;
      }

      .reward-value .value-text {
        font-weight: 600;
        color: #0056b3;
      }

      .points-cost {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: white;
        margin-bottom: 15px;
      }

      .points-cost .icon {
        font-size: 1.5rem;
      }

      .points-cost .cost {
        font-size: 1.8rem;
        font-weight: bold;
      }

      .points-cost .label {
        font-size: 0.9rem;
        opacity: 0.9;
      }

      .redeem-btn {
        width: 100%;
        padding: 12px;
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .redeem-btn:hover:not(:disabled) {
        background: #0056b3;
      }

      .redeem-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }

      .validity-info {
        text-align: center;
        font-size: 0.85rem;
        color: #6c757d;
        margin-top: 10px;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 30px;
      }

      .page-btn {
        padding: 10px 20px;
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
      }

      .page-btn:hover:not(:disabled) {
        background: #0056b3;
      }

      .page-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .page-info {
        font-weight: 600;
        color: #333;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 80px 20px;
      }

      .empty-icon {
        font-size: 5rem;
        margin-bottom: 20px;
      }

      .empty-state h3 {
        font-size: 1.5rem;
        color: #333;
        margin-bottom: 10px;
      }

      .empty-state p {
        color: #6c757d;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .rewards-grid {
          grid-template-columns: 1fr;
        }

        .filters-section {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class RewardsCatalogComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);

  // Signals
  rewards = signal<LoyaltyRewardDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);

  // Filters
  selectedType = '';
  sortBy = 'points-asc';
  pageSize = 12;

  // Computed
  displayedRewards = computed(() => {
    return this.rewards();
  });

  ngOnInit(): void {
    this.loadRewards();
  }

  /**
   * Cargar premios del catálogo
   */
  private loadRewards(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService
      .getAvailableRewards({
        page: this.currentPage(),
        pageSize: this.pageSize,
        isActive: true,
        rewardType: this.selectedType || undefined,
      })
      .subscribe({
        next: (response: PagedLoyaltyRewardsResponse) => {
          this.rewards.set(response.items);
          this.totalPages.set(response.totalPages);
          this.totalItems.set(response.totalItems);
          this.sortRewards();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando premios:', err);
          this.error.set(
            'No se pudieron cargar los premios. Por favor, intenta de nuevo.'
          );
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Cambio en filtros
   */
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadRewards();
  }

  /**
   * Ordenar premios
   */
  sortRewards(): void {
    const rewardsList = [...this.rewards()];

    switch (this.sortBy) {
      case 'points-asc':
        rewardsList.sort((a, b) => a.pointsCost - b.pointsCost);
        break;
      case 'points-desc':
        rewardsList.sort((a, b) => b.pointsCost - a.pointsCost);
        break;
      case 'name-asc':
        rewardsList.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        rewardsList.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    this.rewards.set(rewardsList);
  }

  /**
   * Ir a página específica
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadRewards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Verificar si está agotado
   */
  isOutOfStock(reward: LoyaltyRewardDto): boolean {
    return (
      reward.stock !== null && reward.stock !== undefined && reward.stock <= 0
    );
  }

  /**
   * Verificar si tiene stock bajo
   */
  isLowStock(reward: LoyaltyRewardDto): boolean {
    return (
      reward.stock !== null &&
      reward.stock !== undefined &&
      reward.stock > 0 &&
      reward.stock <= 5
    );
  }

  /**
   * Obtener etiqueta del tipo de premio
   */
  getRewardTypeLabel(type: string): string {
    return REWARD_TYPE_LABELS[type] || type;
  }

  /**
   * Obtener icono según tipo de premio
   */
  getRewardIcon(type: string): string {
    const icons: Record<string, string> = {
      PRODUCT: '📦',
      DISCOUNT_PERCENTAGE: '🏷️',
      DISCOUNT_FIXED: '💵',
      FREE_SHIPPING: '🚚',
    };
    return icons[type] || '🎁';
  }

  /**
   * Canjear premio
   */
  redeemReward(reward: LoyaltyRewardDto): void {
    if (
      confirm(
        `¿Deseas canjear "${reward.name}" por ${reward.pointsCost} puntos?`
      )
    ) {
      this.loyaltyService.redeemReward(reward.id).subscribe({
        next: (response) => {
          alert(`¡Premio canjeado exitosamente! ${response.message}`);
          this.loadRewards(); // Recargar para actualizar stock
        },
        error: (err) => {
          console.error('Error canjeando premio:', err);
          alert(
            'No se pudo canjear el premio. Verifica que tengas suficientes puntos.'
          );
        },
      });
    }
  }
}
