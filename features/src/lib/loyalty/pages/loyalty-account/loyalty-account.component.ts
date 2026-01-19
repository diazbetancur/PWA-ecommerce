import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LoyaltyAccountSummaryDto,
  TIER_COLORS,
  TIER_LABELS,
} from '../../models/loyalty.models';
import { LoyaltyService } from '../../services/loyalty.service';

/**
 * 🎁 Página de Resumen de Cuenta de Lealtad
 *
 * Muestra:
 * - Balance actual de puntos
 * - Tier/nivel del usuario
 * - Total de puntos ganados/gastados lifetime
 * - Acceso rápido a otras secciones (transacciones, premios, canjes)
 */
@Component({
  selector: 'lib-loyalty-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loyalty-account.component.html',
  styles: [
    `
      .loyalty-account-page {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .page-header h1 {
        font-size: 2rem;
        margin-bottom: 10px;
        color: var(--primary-color, #007bff);
      }

      .page-header p {
        color: #6c757d;
        font-size: 1rem;
      }

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

      .account-summary {
        display: flex;
        flex-direction: column;
        gap: 30px;
      }

      /* Balance Card */
      .balance-card {
        background: linear-gradient(
          135deg,
          var(--primary-color, #007bff) 0%,
          #0056b3 100%
        );
        color: white;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        text-align: center;
      }

      .balance-card .card-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .balance-card .icon {
        font-size: 2rem;
      }

      .balance-card .label {
        font-size: 1rem;
        opacity: 0.9;
      }

      .balance-card .balance {
        font-size: 3.5rem;
        font-weight: bold;
        margin: 15px 0;
      }

      .balance-card .tier-badge {
        display: inline-block;
        padding: 8px 20px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
        color: white;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }

      .stat-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .stat-card .stat-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .stat-card .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: var(--primary-color, #007bff);
        margin-bottom: 5px;
      }

      .stat-card .stat-label {
        font-size: 0.9rem;
        color: #6c757d;
      }

      /* Quick Actions */
      .quick-actions h2 {
        font-size: 1.5rem;
        margin-bottom: 20px;
        color: #333;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
      }

      .action-btn {
        background: white;
        border: 2px solid #e0e0e0;
        padding: 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .action-btn:hover {
        border-color: var(--primary-color, #007bff);
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
      }

      .action-btn .icon {
        font-size: 2rem;
      }

      .action-btn .label {
        flex: 1;
        font-weight: 600;
        color: #333;
      }

      .action-btn .arrow {
        font-size: 1.5rem;
        color: var(--primary-color, #007bff);
      }

      /* Info Section */
      .info-section {
        background: #f8f9fa;
        padding: 25px;
        border-radius: 12px;
        border-left: 4px solid var(--primary-color, #007bff);
      }

      .info-section h3 {
        font-size: 1.3rem;
        margin-bottom: 15px;
        color: #333;
      }

      .earn-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .earn-list li {
        padding: 10px 0;
        font-size: 1rem;
        color: #555;
        border-bottom: 1px solid #e0e0e0;
      }

      .earn-list li:last-child {
        border-bottom: none;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .balance-card .balance {
          font-size: 2.5rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .actions-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LoyaltyAccountComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly router = inject(Router);

  // Signals
  account = signal<LoyaltyAccountSummaryDto | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAccount();
  }

  /**
   * Cargar resumen de cuenta
   */
  private loadAccount(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loyaltyService.getMyAccount().subscribe({
      next: (data) => {
        this.account.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cuenta de lealtad:', err);
        this.error.set(
          'No se pudo cargar tu cuenta de lealtad. Por favor, intenta de nuevo.'
        );
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Obtener etiqueta del tier
   */
  getTierLabel(): string {
    const tier = this.account()?.tier || 'BRONZE';
    return TIER_LABELS[tier] || tier;
  }

  /**
   * Obtener color del tier
   */
  getTierColor(): string {
    const tier = this.account()?.tier || 'BRONZE';
    return TIER_COLORS[tier] || '#CD7F32';
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Navegar a catálogo de premios
   */
  navigateToRewards(): void {
    this.router.navigate(['/loyalty/rewards']);
  }

  /**
   * Navegar a mis canjes
   */
  navigateToRedemptions(): void {
    this.router.navigate(['/loyalty/redemptions']);
  }

  /**
   * Navegar a historial de transacciones
   */
  navigateToTransactions(): void {
    this.router.navigate(['/loyalty/transactions']);
  }
}
