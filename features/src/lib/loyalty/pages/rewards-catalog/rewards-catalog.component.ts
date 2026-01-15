import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoyaltyService } from '../../services/loyalty.service';
import {
  LoyaltyRewardDto,
  REWARD_TYPE_LABELS,
  PagedLoyaltyRewardsResponse,
} from '../../models/loyalty.models';

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
  template: `
    <div class="rewards-catalog-page">
      <!-- Header -->
      <div class="page-header">
        <h1>🎁 Catálogo de Premios</h1>
        <p>Canjea tus puntos por productos y descuentos exclusivos</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="rewardType">Tipo de Premio:</label>
          <select
            id="rewardType"
            [(ngModel)]="selectedType"
            (change)="onFilterChange()"
            class="form-select"
          >
            <option value="">Todos</option>
            <option value="PRODUCT">Productos</option>
            <option value="DISCOUNT_PERCENTAGE">Descuentos %</option>
            <option value="DISCOUNT_FIXED">Descuentos Fijos</option>
            <option value="FREE_SHIPPING">Envío Gratis</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="sortBy">Ordenar por:</label>
          <select
            id="sortBy"
            [(ngModel)]="sortBy"
            (change)="sortRewards()"
            class="form-select"
          >
            <option value="points-asc">Puntos: Menor a Mayor</option>
            <option value="points-desc">Puntos: Mayor a Menor</option>
            <option value="name-asc">Nombre: A-Z</option>
            <option value="name-desc">Nombre: Z-A</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando premios...</p>
      </div>
      }

      <!-- Error State -->
      @if (error()) {
      <div class="alert alert-danger">
        <strong>Error:</strong> {{ error() }}
      </div>
      }

      <!-- Rewards Grid -->
      @if (!isLoading() && displayedRewards().length > 0) {
      <div class="rewards-grid">
        @for (reward of displayedRewards(); track reward.id) {
        <div class="reward-card" [class.out-of-stock]="isOutOfStock(reward)">
          <!-- Image -->
          <div class="reward-image">
            @if (reward.imageUrl) {
            <img [src]="reward.imageUrl" [alt]="reward.name" />
            } @else {
            <div class="placeholder-image">
              {{ getRewardIcon(reward.rewardType) }}
            </div>
            }

            <!-- Stock Badge -->
            @if (isOutOfStock(reward)) {
            <div class="stock-badge out">Agotado</div>
            } @else if (isLowStock(reward)) {
            <div class="stock-badge low">¡Últimas unidades!</div>
            }

            <!-- Type Badge -->
            <div class="type-badge">
              {{ getRewardTypeLabel(reward.rewardType) }}
            </div>
          </div>

          <!-- Content -->
          <div class="reward-content">
            <h3 class="reward-name">{{ reward.name }}</h3>
            <p class="reward-description">{{ reward.description }}</p>

            <!-- Reward Value -->
            @if (reward.discountValue) {
            <div class="reward-value">
              <span class="value-icon">💰</span>
              <span class="value-text">
                @if (reward.rewardType === 'DISCOUNT_PERCENTAGE') {
                {{ reward.discountValue }}% de descuento } @else {
                {{
                  reward.discountValue | currency : 'USD' : 'symbol' : '1.2-2'
                }}
                de descuento }
              </span>
            </div>
            }

            <!-- Points Cost -->
            <div class="points-cost">
              <span class="icon">💎</span>
              <span class="cost">{{
                reward.pointsCost | number : '1.0-0'
              }}</span>
              <span class="label">puntos</span>
            </div>

            <!-- Action Button -->
            <button
              class="redeem-btn"
              [disabled]="isOutOfStock(reward)"
              (click)="redeemReward(reward)"
            >
              @if (isOutOfStock(reward)) { Agotado } @else { Canjear Ahora }
            </button>

            <!-- Validity Info -->
            @if (reward.validityDays) {
            <div class="validity-info">
              ⏰ Válido por {{ reward.validityDays }} días
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
      <div class="pagination">
        <button
          class="page-btn"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)"
        >
          ← Anterior
        </button>

        <span class="page-info">
          Página {{ currentPage() }} de {{ totalPages() }}
        </span>

        <button
          class="page-btn"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)"
        >
          Siguiente →
        </button>
      </div>
      } }

      <!-- Empty State -->
      @if (!isLoading() && displayedRewards().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">🎁</div>
        <h3>No hay premios disponibles</h3>
        <p>Vuelve pronto para ver nuevos premios en el catálogo</p>
      </div>
      }
    </div>
  `,
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
