import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * 🧭 Componente de Navegación de Lealtad
 *
 * Tabs/Enlaces para navegar entre las secciones del programa de lealtad
 */
@Component({
  selector: 'lib-loyalty-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="loyalty-nav">
      <a
        routerLink="/loyalty/account"
        routerLinkActive="active"
        class="nav-item"
      >
        <span class="icon">💎</span>
        <span class="label">Mi Cuenta</span>
      </a>
      <a
        routerLink="/loyalty/rewards"
        routerLinkActive="active"
        class="nav-item"
      >
        <span class="icon">🎁</span>
        <span class="label">Premios</span>
      </a>
      <a
        routerLink="/loyalty/redemptions"
        routerLinkActive="active"
        class="nav-item"
      >
        <span class="icon">🎟️</span>
        <span class="label">Mis Canjes</span>
      </a>
      <a
        routerLink="/loyalty/transactions"
        routerLinkActive="active"
        class="nav-item"
      >
        <span class="icon">📊</span>
        <span class="label">Historial</span>
      </a>
    </nav>
  `,
  styles: [
    `
      .loyalty-nav {
        display: flex;
        gap: 8px;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow-x: auto;
        margin-bottom: 24px;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 20px;
        border-radius: 8px;
        text-decoration: none;
        color: #6c757d;
        background: #f8f9fa;
        transition: all 0.2s;
        white-space: nowrap;
        min-width: 100px;
      }

      .nav-item:hover {
        background: #e9ecef;
        color: #495057;
        transform: translateY(-2px);
      }

      .nav-item.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .icon {
        font-size: 1.5rem;
      }

      .label {
        font-size: 0.85rem;
        font-weight: 600;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .loyalty-nav {
          padding: 12px;
          gap: 6px;
        }

        .nav-item {
          padding: 10px 12px;
          min-width: 80px;
        }

        .icon {
          font-size: 1.3rem;
        }

        .label {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class LoyaltyNavComponent {}
