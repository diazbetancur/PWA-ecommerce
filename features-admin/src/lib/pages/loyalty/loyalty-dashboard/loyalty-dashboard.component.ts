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
  templateUrl: './loyalty-dashboard.component.html',
  styleUrl: './loyalty-dashboard.component.scss',
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
    this.router.navigate(['/tenant-admin/loyalty/rewards']);
  }

  navigateToRedemptions(): void {
    this.router.navigate(['/tenant-admin/loyalty/redemptions']);
  }

  navigateToPointsAdjustment(): void {
    this.router.navigate(['/tenant-admin/loyalty/points-adjustments']);
  }
  navigateToConfig(): void {
    this.router.navigate(['/tenant-admin/loyalty/config']);
  }
}
