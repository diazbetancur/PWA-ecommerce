import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/**
 * 📊 Dashboard de Administración del Programa de Lealtad
 *
 * Muestra métricas y estadísticas generales:
 * - Total de usuarios activos
 * - Puntos emitidos vs canjeados
 * - Premios más populares
 * - Canjes pendientes de aprobación
 * - Gráficas de tendencias
 */
@Component({
  selector: 'lib-loyalty-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loyalty-dashboard-page">
      <!-- Header -->
      <div class="page-header">
        <h1>📊 Panel de Lealtad</h1>
        <p>Gestión y métricas del programa de lealtad</p>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ mockStats.totalUsers | number }}</div>
          <div class="stat-label">Usuarios Activos</div>
          <div class="stat-change positive">+12% este mes</div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon">💎</div>
          <div class="stat-value">{{ mockStats.pointsIssued | number }}</div>
          <div class="stat-label">Puntos Emitidos</div>
          <div class="stat-change positive">+8% este mes</div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">🎁</div>
          <div class="stat-value">
            {{ mockStats.totalRedemptions | number }}
          </div>
          <div class="stat-label">Canjes Realizados</div>
          <div class="stat-change positive">+15% este mes</div>
        </div>

        <div class="stat-card danger">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">{{ mockStats.pendingRedemptions }}</div>
          <div class="stat-label">Canjes Pendientes</div>
          <div class="stat-change">Requieren atención</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <button class="action-card" (click)="navigateToRewards()">
            <span class="action-icon">🎁</span>
            <span class="action-label">Gestionar Premios</span>
            <span class="action-arrow">→</span>
          </button>

          <button class="action-card" (click)="navigateToRedemptions()">
            <span class="action-icon">🎟️</span>
            <span class="action-label">Revisar Canjes</span>
            @if (mockStats.pendingRedemptions > 0) {
            <span class="badge">{{ mockStats.pendingRedemptions }}</span>
            }
            <span class="action-arrow">→</span>
          </button>

          <button class="action-card" (click)="navigateToPointsAdjustment()">
            <span class="action-icon">⚙️</span>
            <span class="action-label">Ajustar Puntos</span>
            <span class="action-arrow">→</span>
          </button>

          <button class="action-card" (click)="navigateToConfig()">
            <span class="action-icon">🛠️</span>
            <span class="action-label">Configuración</span>
            <span class="action-arrow">→</span>
          </button>
        </div>
      </div>

      <!-- Top Rewards -->
      <div class="section">
        <h2>Premios Más Populares</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Premio</th>
                <th>Canjes</th>
                <th>Puntos</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              @for (reward of mockTopRewards; track reward.id) {
              <tr>
                <td class="reward-cell">
                  <div class="reward-info">
                    <strong>{{ reward.name }}</strong>
                    <span class="reward-type">{{ reward.type }}</span>
                  </div>
                </td>
                <td>{{ reward.redemptions }}</td>
                <td>{{ reward.points | number }}</td>
                <td class="amount">{{ reward.revenue | currency }}</td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="section">
        <h2>Actividad Reciente</h2>
        <div class="activity-list">
          @for (activity of mockRecentActivity; track activity.id) {
          <div class="activity-item">
            <div class="activity-icon">{{ activity.icon }}</div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-meta">
                <span>{{ activity.user }}</span>
                <span>•</span>
                <span>{{ activity.time }}</span>
              </div>
            </div>
            <div class="activity-badge" [attr.data-status]="activity.status">
              {{ activity.statusLabel }}
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Tier Distribution -->
      <!-- <div class="section">
        <h2>Distribución de Niveles</h2>
        <div class="tier-distribution">
          @for (tier of mockTierDistribution; track tier.level) {
          <div class="tier-item">
            <div class="tier-header">
              <span class="tier-name" [style.color]="tier.color">{{
                tier.level
              }}</span>
              <span class="tier-count">{{ tier.count }} usuarios</span>
            </div>
            <div class="tier-bar-container">
              <div
                class="tier-bar"
                [style.width.%]="tier.percentage"
                [style.background-color]="tier.color"
              ></div>
            </div>
            <div class="tier-percentage">{{ tier.percentage }}%</div>
          </div>
          }
        </div>
      </div> -->
    </div>
  `,
  styles: [
    `
      .loyalty-dashboard-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 30px;
      }

      .page-header h1 {
        font-size: 2rem;
        color: #333;
        margin-bottom: 5px;
      }

      .page-header p {
        color: #6c757d;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .stat-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-left: 4px solid;
      }

      .stat-card.primary {
        border-left-color: #007bff;
      }
      .stat-card.success {
        border-left-color: #28a745;
      }
      .stat-card.warning {
        border-left-color: #ffc107;
      }
      .stat-card.danger {
        border-left-color: #dc3545;
      }

      .stat-icon {
        font-size: 2.5rem;
        margin-bottom: 15px;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 0.9rem;
        color: #6c757d;
        margin-bottom: 10px;
      }

      .stat-change {
        font-size: 0.85rem;
        color: #6c757d;
      }

      .stat-change.positive {
        color: #28a745;
        font-weight: 600;
      }

      /* Section */
      .section {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
      }

      .section h2 {
        font-size: 1.5rem;
        margin-bottom: 20px;
        color: #333;
      }

      /* Actions Grid */
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
      }

      .action-card {
        background: #f8f9fa;
        border: 2px solid #e0e0e0;
        padding: 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .action-card:hover {
        border-color: #007bff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
      }

      .action-icon {
        font-size: 2rem;
      }

      .action-label {
        flex: 1;
        font-weight: 600;
        color: #333;
        text-align: left;
      }

      .action-arrow {
        font-size: 1.5rem;
        color: #007bff;
      }

      .badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #dc3545;
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;
      }

      /* Table */
      .table-container {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        background: #f8f9fa;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
      }

      .data-table td {
        padding: 12px;
        border-bottom: 1px solid #dee2e6;
      }

      .data-table tbody tr:hover {
        background: #f8f9fa;
      }

      .reward-cell .reward-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .reward-type {
        font-size: 0.85rem;
        color: #6c757d;
      }

      .amount {
        font-weight: 600;
        color: #28a745;
      }

      /* Activity List */
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .activity-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .activity-content {
        flex: 1;
      }

      .activity-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .activity-meta {
        font-size: 0.85rem;
        color: #6c757d;
        display: flex;
        gap: 8px;
      }

      .activity-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }

      .activity-badge[data-status='success'] {
        background: #28a745;
      }
      .activity-badge[data-status='warning'] {
        background: #ffc107;
        color: #000;
      }
      .activity-badge[data-status='info'] {
        background: #17a2b8;
      }

      /* Tier Distribution */
      .tier-distribution {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .tier-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tier-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tier-name {
        font-weight: 600;
        font-size: 1rem;
      }

      .tier-count {
        font-size: 0.9rem;
        color: #6c757d;
      }

      .tier-bar-container {
        height: 12px;
        background: #e9ecef;
        border-radius: 6px;
        overflow: hidden;
      }

      .tier-bar {
        height: 100%;
        transition: width 0.3s;
      }

      .tier-percentage {
        font-size: 0.85rem;
        color: #6c757d;
        text-align: right;
      }

      /* Responsive */
      @media (max-width: 768px) {
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
export class LoyaltyDashboardComponent implements OnInit {
  private readonly router = inject(Router);

  // Mock data (en producción vendría del servicio)
  mockStats = {
    totalUsers: 5432,
    pointsIssued: 1250000,
    totalRedemptions: 892,
    pendingRedemptions: 23,
  };

  mockTopRewards = [
    {
      id: '1',
      name: 'Descuento 20%',
      type: 'Descuento',
      redemptions: 245,
      points: 500,
      revenue: 12250,
    },
    {
      id: '2',
      name: 'Envío Gratis',
      type: 'Beneficio',
      redemptions: 198,
      points: 300,
      revenue: 5940,
    },
    {
      id: '3',
      name: 'Producto Premium',
      type: 'Producto',
      redemptions: 156,
      points: 1000,
      revenue: 15600,
    },
    {
      id: '4',
      name: 'Descuento $50',
      type: 'Descuento',
      redemptions: 134,
      points: 750,
      revenue: 6700,
    },
  ];

  mockRecentActivity = [
    {
      id: '1',
      icon: '🎁',
      title: 'Nuevo premio creado',
      user: 'Admin Usuario',
      time: 'Hace 5 min',
      status: 'success',
      statusLabel: 'Completado',
    },
    {
      id: '2',
      icon: '⏳',
      title: 'Canje pendiente de aprobación',
      user: 'Juan Pérez',
      time: 'Hace 15 min',
      status: 'warning',
      statusLabel: 'Pendiente',
    },
    {
      id: '3',
      icon: '✅',
      title: 'Canje aprobado',
      user: 'María García',
      time: 'Hace 30 min',
      status: 'success',
      statusLabel: 'Aprobado',
    },
    {
      id: '4',
      icon: '⚙️',
      title: 'Ajuste de puntos realizado',
      user: 'Admin Usuario',
      time: 'Hace 1 hora',
      status: 'info',
      statusLabel: 'Ajuste',
    },
  ];

  mockTierDistribution = [
    { level: 'Bronce', count: 2456, percentage: 45.2, color: '#CD7F32' },
    { level: 'Plata', count: 1789, percentage: 32.9, color: '#C0C0C0' },
    { level: 'Oro', count: 892, percentage: 16.4, color: '#FFD700' },
    { level: 'Platino', count: 295, percentage: 5.5, color: '#E5E4E2' },
  ];

  ngOnInit(): void {
    // En producción, cargar datos reales aquí
  }

  navigateToRewards(): void {
    this.router.navigate(['/admin/loyalty/rewards']);
  }

  navigateToRedemptions(): void {
    this.router.navigate(['/admin/loyalty/redemptions']);
  }

  navigateToPointsAdjustment(): void {
    this.router.navigate(['/admin/loyalty/points-adjustment']);
  }
  navigateToConfig(): void {
    this.router.navigate(['/tenant-admin/loyalty/config']);
  }
}
