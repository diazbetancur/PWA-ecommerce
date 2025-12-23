import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService, TenantAdminMenuService } from '@pwa/core';

/**
 * 🎯 Componente del Menú de Administración del Tenant
 *
 * Muestra el menú lateral dinámico basado en los permisos del usuario.
 * Este es para administradores DE UN TENANT (no SuperAdmin).
 *
 * Los clientes (customers) NO ven este menú.
 */
@Component({
  selector: 'app-tenant-admin-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-menu">
      <!-- Header del Usuario -->
      <div class="menu-header">
        <div class="user-info">
          <div class="avatar">
            {{ userInitials() }}
          </div>
          <div class="user-details">
            <p class="user-name">{{ userName() }}</p>
            <p class="user-role">{{ userRole() }}</p>
          </div>
        </div>
      </div>

      <!-- Items del Menú -->
      <nav class="menu-items">
        @for (item of menuItems(); track item.id) { @if (item.children &&
        item.children.length > 0) {
        <!-- Item con hijos (grupo expandible) -->
        <div class="menu-group">
          <div
            class="menu-group-header"
            (click)="toggleGroup(item.id)"
            [class.collapsed]="!isGroupExpanded(item.id)"
          >
            <span class="material-icons">{{ item.icon }}</span>
            <span class="menu-label">{{ item.label }}</span>
            <span class="material-icons expand-icon">
              {{ isGroupExpanded(item.id) ? 'expand_more' : 'chevron_right' }}
            </span>
          </div>
          @if (isGroupExpanded(item.id)) {
          <div class="menu-group-children">
            @for (child of item.children; track child.id) {
            <a
              [routerLink]="child.route"
              routerLinkActive="active"
              class="menu-item submenu-item"
            >
              <span class="material-icons">{{ child.icon }}</span>
              <span class="menu-label">{{ child.label }}</span>
              @if (child.badge) {
              <span class="menu-badge" [class]="'badge-' + child.badge.color">
                {{ child.badge.text }}
              </span>
              }
            </a>
            }
          </div>
          }
        </div>
        } @else {
        <!-- Item simple -->
        <a
          [routerLink]="item.route"
          routerLinkActive="active"
          class="menu-item"
        >
          <span class="material-icons">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
          @if (item.badge) {
          <span class="menu-badge" [class]="'badge-' + item.badge.color">
            {{ item.badge.text }}
          </span>
          }
        </a>
        } @if (item.divider) {
        <div class="menu-divider"></div>
        } }
      </nav>

      <!-- Footer con acciones -->
      <div class="menu-footer">
        <button type="button" class="menu-item" (click)="logout()">
          <span class="material-icons">logout</span>
          <span class="menu-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-menu {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 280px;
        background: #fff;
        border-right: 1px solid #e5e7eb;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
      }

      /* Header */
      .menu-header {
        padding: 1.5rem 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1.125rem;
      }

      .user-details {
        flex: 1;
        min-width: 0;
      }

      .user-name {
        font-weight: 600;
        color: #111827;
        margin: 0;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0.25rem 0 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Menu Items */
      .menu-items {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: #4b5563;
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        font-size: 0.875rem;
      }

      .menu-item:hover {
        background: #f3f4f6;
        color: #1f2937;
      }

      .menu-item.active {
        background: #eff6ff;
        color: #2563eb;
        border-right: 3px solid #2563eb;
      }

      .menu-item .material-icons {
        font-size: 20px;
      }

      .menu-label {
        flex: 1;
      }

      .menu-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 600;
      }

      .badge-primary {
        background: #dbeafe;
        color: #1e40af;
      }

      .badge-success {
        background: #d1fae5;
        color: #065f46;
      }

      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }

      .badge-danger {
        background: #fee2e2;
        color: #991b1b;
      }

      /* Menu Groups */
      .menu-group {
        margin-bottom: 0.5rem;
      }

      .menu-group-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: #6b7280;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .menu-group-header:hover {
        background: #f3f4f6;
        color: #1f2937;
      }

      .menu-group-header .material-icons {
        font-size: 18px;
      }

      .menu-group-header .expand-icon {
        margin-left: auto;
        font-size: 20px;
        transition: transform 0.2s;
      }

      .menu-group-header.collapsed .expand-icon {
        transform: rotate(0deg);
      }

      .menu-group-children {
        padding-left: 1rem;
        animation: slideDown 0.2s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .submenu-item {
        padding-left: 2.5rem;
      }

      .menu-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 0.5rem 1rem;
      }

      /* Footer */
      .menu-footer {
        border-top: 1px solid #e5e7eb;
        padding: 1rem 0;
      }

      .menu-footer .menu-item {
        color: #dc2626;
      }

      .menu-footer .menu-item:hover {
        background: #fee2e2;
      }

      /* Scrollbar */
      .menu-items::-webkit-scrollbar {
        width: 6px;
      }

      .menu-items::-webkit-scrollbar-track {
        background: transparent;
      }

      .menu-items::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }

      .menu-items::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `,
  ],
})
export class TenantAdminMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(TenantAdminMenuService);
  private readonly router = inject(Router);

  // Signal para controlar qué grupos están expandidos
  private readonly expandedGroups = signal<Set<string>>(
    new Set(['catalog', 'settings'])
  );

  constructor() {
    console.log('🎯 [TenantAdminMenuComponent] Component initialized');
    console.log('🎯 [TenantAdminMenuComponent] MenuService:', this.menuService);
  }

  // Computed signals
  readonly menuItems = computed(() => {
    const items = this.menuService.menu();
    console.log('🎯 [TenantAdminMenuComponent] Menu items computed:', items);
    return items;
  });

  readonly userName = computed(() => {
    const claims = this.authService.claims;
    return claims?.email || 'Usuario';
  });

  readonly userRole = computed(() => {
    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    return roles.length > 0 ? roles.join(', ') : 'Usuario';
  });

  readonly userInitials = computed(() => {
    const name = this.userName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  // Métodos para manejar el estado de expansión
  toggleGroup(groupId: string): void {
    const expanded = this.expandedGroups();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }

    this.expandedGroups.set(newExpanded);
  }

  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  logout(): void {
    this.authService.clear();
    this.router.navigate(['/login']);
  }
}
