import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'lib-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard Administrativo</h1>
      <p>Bienvenido al panel de administración general</p>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Tenants</h3>
          <p class="stat-value">24</p>
        </div>
        <div class="stat-card">
          <h3>Usuarios Activos</h3>
          <p class="stat-value">1,234</p>
        </div>
        <div class="stat-card">
          <h3>Subscripciones</h3>
          <p class="stat-value">18</p>
        </div>
        <div class="stat-card">
          <h3>Ingresos del Mes</h3>
          <p class="stat-value">$12,450</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        padding: 2rem;
      }

      h1 {
        margin-bottom: 0.5rem;
        color: #1e293b;
      }

      p {
        color: #64748b;
        margin-bottom: 2rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-card h3 {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
        margin: 0 0 0.5rem 0;
        text-transform: uppercase;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
    `,
  ],
})
export class AdminDashboardComponent {}
