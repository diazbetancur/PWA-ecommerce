import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';
import {
  LoyaltyRewardDto,
  REWARD_TYPE_LABELS,
  PagedLoyaltyRewardsResponse,
} from '../../../models/loyalty.models';

/**
 * 📋 Lista de Premios (Admin)
 *
 * Gestión completa de premios:
 * - Listado con filtros y búsqueda
 * - Activar/desactivar premios
 * - Editar y eliminar premios
 * - Crear nuevo premio
 */
@Component({
  selector: 'lib-rewards-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rewards-list-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>🎁 Gestión de Premios</h1>
          <p>Administra el catálogo de premios del programa de lealtad</p>
        </div>
        <button class="btn-primary" (click)="createReward()">
          <span class="icon">➕</span>
          Crear Premio
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="typeFilter">Tipo:</label>
          <select
            id="typeFilter"
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
          <label for="statusFilter">Estado:</label>
          <select
            id="statusFilter"
            [(ngModel)]="selectedStatus"
            (change)="onFilterChange()"
            class="form-select"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div class="filter-group search">
          <label for="searchInput">Buscar:</label>
          <input
            type="text"
            id="searchInput"
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()"
            placeholder="Nombre del premio..."
            class="form-input"
          />
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

      <!-- Rewards Table -->
      @if (!isLoading() && rewards().length > 0) {
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Premio</th>
              <th>Tipo</th>
              <th>Costo (Puntos)</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (reward of rewards(); track reward.id) {
            <tr>
              <td class="reward-cell">
                <div class="reward-info">
                  @if (reward.imageUrl) {
                  <img
                    [src]="reward.imageUrl"
                    [alt]="reward.name"
                    class="reward-thumb"
                  />
                  }
                  <div class="reward-details">
                    <strong>{{ reward.name }}</strong>
                    <span class="reward-desc">{{
                      truncateDescription(reward.description)
                    }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="type-badge">{{
                  getRewardTypeLabel(reward.rewardType)
                }}</span>
              </td>
              <td class="points-cell">
                <span class="icon">💎</span>
                {{ reward.pointsCost | number }}
              </td>
              <td>
                @if (reward.stock === null || reward.stock === undefined) {
                <span class="stock-badge unlimited">Ilimitado</span>
                } @else if (reward.stock === 0) {
                <span class="stock-badge out">Agotado</span>
                } @else if (reward.stock <= 5) {
                <span class="stock-badge low">{{ reward.stock }} unidades</span>
                } @else {
                <span class="stock-badge available"
                  >{{ reward.stock }} unidades</span
                >
                }
              </td>
              <td>
                <div class="toggle-container">
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      [checked]="reward.isActive"
                      (change)="toggleRewardStatus(reward)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="toggle-label">{{
                    reward.isActive ? 'Activo' : 'Inactivo'
                  }}</span>
                </div>
              </td>
              <td class="actions-cell">
                <button
                  class="btn-icon"
                  (click)="editReward(reward)"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  class="btn-icon danger"
                  (click)="deleteReward(reward)"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </td>
            </tr>
            }
          </tbody>
        </table>
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
          <span class="total-items">({{ totalItems() }} premios)</span>
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
      @if (!isLoading() && rewards().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">🎁</div>
        <h3>No hay premios</h3>
        <p>Crea el primer premio del catálogo</p>
        <button class="btn-primary" (click)="createReward()">
          Crear Primer Premio
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .rewards-list-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        gap: 20px;
      }

      .header-content h1 {
        font-size: 2rem;
        color: #333;
        margin-bottom: 5px;
      }

      .header-content p {
        color: #6c757d;
      }

      .btn-primary {
        padding: 12px 24px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: #0056b3;
      }

      .btn-primary .icon {
        font-size: 1.2rem;
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

      .filter-group.search {
        flex: 2;
      }

      .filter-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-select,
      .form-input {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .form-select:focus,
      .form-input:focus {
        outline: none;
        border-color: #007bff;
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
        border-top: 4px solid #007bff;
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

      .alert-danger {
        padding: 15px;
        border-radius: 8px;
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        margin-bottom: 20px;
      }

      /* Table */
      .table-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        background: #f8f9fa;
        padding: 15px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
      }

      .data-table td {
        padding: 15px;
        border-bottom: 1px solid #dee2e6;
      }

      .data-table tbody tr:hover {
        background: #f8f9fa;
      }

      .reward-cell .reward-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .reward-thumb {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 8px;
      }

      .reward-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .reward-desc {
        font-size: 0.85rem;
        color: #6c757d;
      }

      .type-badge {
        display: inline-block;
        padding: 4px 12px;
        background: #e7f3ff;
        color: #0056b3;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .points-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #007bff;
      }

      .points-cell .icon {
        font-size: 1.1rem;
      }

      .stock-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .stock-badge.unlimited {
        background: #e7f3ff;
        color: #0056b3;
      }

      .stock-badge.available {
        background: #d4edda;
        color: #155724;
      }

      .stock-badge.low {
        background: #fff3cd;
        color: #856404;
      }

      .stock-badge.out {
        background: #f8d7da;
        color: #721c24;
      }

      /* Toggle Switch */
      .toggle-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 26px;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.3s;
        border-radius: 26px;
      }

      .toggle-slider:before {
        position: absolute;
        content: '';
        height: 18px;
        width: 18px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: #28a745;
      }

      input:checked + .toggle-slider:before {
        transform: translateX(22px);
      }

      .toggle-label {
        font-size: 0.9rem;
        color: #6c757d;
      }

      /* Actions */
      .actions-cell {
        display: flex;
        gap: 8px;
      }

      .btn-icon {
        padding: 8px 12px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.1rem;
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: #e9ecef;
        transform: scale(1.1);
      }

      .btn-icon.danger:hover {
        background: #f8d7da;
        border-color: #f5c6cb;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .page-btn {
        padding: 10px 20px;
        background: #007bff;
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
        text-align: center;
      }

      .total-items {
        display: block;
        font-size: 0.85rem;
        font-weight: normal;
        color: #6c757d;
        margin-top: 3px;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 80px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
        margin-bottom: 25px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
        }

        .filters-section {
          flex-direction: column;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          min-width: 800px;
        }
      }
    `,
  ],
})
export class RewardsListComponent implements OnInit {
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);
  private readonly router = inject(Router);

  // Signals
  rewards = signal<LoyaltyRewardDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);

  // Filters
  selectedType = '';
  selectedStatus = '';
  searchTerm = '';
  pageSize = 15;

  ngOnInit(): void {
    this.loadRewards();
  }

  /**
   * Cargar premios
   */
  private loadRewards(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const isActive =
      this.selectedStatus === '' ? undefined : this.selectedStatus === 'true';

    this.loyaltyAdminService
      .listRewards({
        page: this.currentPage(),
        pageSize: this.pageSize,
        isActive,
        rewardType: this.selectedType || undefined,
      })
      .subscribe({
        next: (response: PagedLoyaltyRewardsResponse) => {
          let items = response.items;

          // Filtro local por búsqueda (en producción debería ser server-side)
          if (this.searchTerm) {
            items = items.filter(
              (r) =>
                r.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                r.description
                  .toLowerCase()
                  .includes(this.searchTerm.toLowerCase())
            );
          }

          this.rewards.set(items);
          this.totalPages.set(response.totalPages);
          this.totalItems.set(response.totalItems);
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
   * Cambio en búsqueda (con debounce idealmente)
   */
  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadRewards();
  }

  /**
   * Ir a página
   */
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadRewards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Obtener etiqueta del tipo
   */
  getRewardTypeLabel(type: string): string {
    return REWARD_TYPE_LABELS[type] || type;
  }

  /**
   * Truncar descripción
   */
  truncateDescription(desc: string): string {
    return desc.length > 60 ? desc.substring(0, 60) + '...' : desc;
  }

  /**
   * Activar/desactivar premio
   */
  toggleRewardStatus(reward: LoyaltyRewardDto): void {
    const newStatus = !reward.isActive;

    this.loyaltyAdminService
      .updateReward(reward.id, {
        ...reward,
        isActive: newStatus,
      })
      .subscribe({
        next: () => {
          reward.isActive = newStatus;
          this.rewards.set([...this.rewards()]);
        },
        error: (err) => {
          console.error('Error actualizando estado:', err);
          alert('No se pudo actualizar el estado del premio');
        },
      });
  }

  /**
   * Crear nuevo premio
   */
  createReward(): void {
    this.router.navigate(['/admin/loyalty/rewards/new']);
  }

  /**
   * Editar premio
   */
  editReward(reward: LoyaltyRewardDto): void {
    this.router.navigate(['/admin/loyalty/rewards', reward.id, 'edit']);
  }

  /**
   * Eliminar premio
   */
  deleteReward(reward: LoyaltyRewardDto): void {
    if (confirm(`¿Estás seguro de eliminar el premio "${reward.name}"?`)) {
      this.loyaltyAdminService.deleteReward(reward.id).subscribe({
        next: () => {
          this.loadRewards();
        },
        error: (err) => {
          console.error('Error eliminando premio:', err);
          alert('No se pudo eliminar el premio');
        },
      });
    }
  }
}
