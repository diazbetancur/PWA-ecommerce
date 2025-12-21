/**
 * 🎨 Admin Shell Component
 *
 * Layout principal del módulo superadmin con:
 * - Sidebar izquierdo con menú dinámico
 * - Header con información del usuario
 * - Área de contenido con <router-outlet>
 * - Responsive (colapsa sidebar en móvil)
 */

import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@pwa/core';
import { AdminMenuService } from '../../services/admin-menu.service';

@Component({
  selector: 'lib-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout" [class.menu-collapsed]="isMenuCollapsed()">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <button
            class="menu-toggle"
            (click)="toggleMenu()"
            aria-label="Toggle menu"
          >
            <span class="material-icons">{{
              isMenuCollapsed() ? 'menu' : 'menu_open'
            }}</span>
          </button>
          @if (!isMenuCollapsed()) {
          <h1 class="admin-title">Admin Panel</h1>
          }
        </div>

        <nav class="sidebar-nav">
          @for (item of menuItems(); track item.id) {
          <div class="nav-item" [class.active]="isRouteActive(item.route)">
            @if (item.route && !item.children) {
            <a [routerLink]="item.route" class="nav-link">
              @if (item.icon) {
              <span class="material-icons">{{ item.icon }}</span>
              } @if (!isMenuCollapsed()) {
              <span class="nav-label">{{ item.label }}</span>
              } @if (item.badge && !isMenuCollapsed()) {
              <span class="badge" [class]="'badge-' + item.badge.color">{{
                item.badge.text
              }}</span>
              }
            </a>
            } @else if (item.children) {
            <div class="nav-group" [class.expanded]="isItemExpanded(item.id)">
              <button
                class="nav-link nav-group-toggle"
                (click)="toggleMenuItem(item.id)"
              >
                @if (item.icon) {
                <span class="material-icons">{{ item.icon }}</span>
                } @if (!isMenuCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
                <span class="material-icons expand-icon">expand_more</span>
                }
              </button>
              @if (!isMenuCollapsed() && isItemExpanded(item.id)) {
              <div class="nav-children">
                @for (child of item.children; track child.id) { @if
                (child.route) {
                <a
                  [routerLink]="child.route"
                  class="nav-link nav-child"
                  [class.active]="isRouteActive(child.route)"
                >
                  @if (child.icon) {
                  <span class="material-icons">{{ child.icon }}</span>
                  }
                  <span class="nav-label">{{ child.label }}</span>
                </a>
                } }
              </div>
              }
            </div>
            } @if (item.showDivider) {
            <hr class="nav-divider" />
            }
          </div>
          }
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="admin-main">
        <!-- Header -->
        <header class="admin-header">
          <div class="header-left">
            <h2 class="page-title">Administrador General</h2>
          </div>
          <div class="header-right">
            <div class="user-menu">
              <button class="user-button" (click)="toggleUserMenu()">
                <span class="user-avatar">{{ userName()[0] }}</span>
                <span class="user-name">{{ userName() }}</span>
                <span class="material-icons">expand_more</span>
              </button>
              @if (showUserMenu()) {
              <div class="user-dropdown">
                <div class="dropdown-header">
                  <div class="dropdown-user-name">{{ userName() }}</div>
                  <div class="dropdown-user-email">{{ userEmail() }}</div>
                  <div class="dropdown-user-role">{{ userRole() }}</div>
                </div>
                <hr />
                <button
                  class="dropdown-item"
                  (click)="navigateTo('/admin/profile')"
                >
                  <span class="material-icons">person</span>
                  Mi Perfil
                </button>
                <button
                  class="dropdown-item"
                  (click)="navigateTo('/admin/settings')"
                >
                  <span class="material-icons">settings</span>
                  Configuración
                </button>
                <hr />
                <button class="dropdown-item danger" (click)="logout()">
                  <span class="material-icons">logout</span>
                  Cerrar Sesión
                </button>
              </div>
              }
            </div>
          </div>
        </header>

        <!-- Content Area -->
        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
      }

      .admin-sidebar {
        width: 280px;
        background: #1e293b;
        color: white;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      }

      .menu-collapsed .admin-sidebar {
        width: 64px;
      }

      .sidebar-header {
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .menu-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .menu-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .admin-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0;
      }

      .nav-item {
        margin: 0.25rem 0;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
      }

      .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .nav-item.active .nav-link {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
      }

      .nav-label {
        flex: 1;
      }

      .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge-accent {
        background: #3b82f6;
        color: white;
      }

      .nav-group-toggle {
        justify-content: space-between;
      }

      .nav-group .expand-icon {
        transition: transform 0.2s ease;
      }

      .nav-group.expanded .expand-icon {
        transform: rotate(180deg);
      }

      .nav-children {
        padding-left: 1rem;
      }

      .nav-child {
        padding-left: 2rem;
      }

      .nav-divider {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin: 0.5rem 1rem;
      }

      .admin-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .admin-header {
        height: 64px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .page-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: #1e293b;
      }

      .user-menu {
        position: relative;
      }

      .user-button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .user-button:hover {
        background: #f3f4f6;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .user-name {
        font-weight: 500;
        color: #1e293b;
      }

      .user-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 240px;
        z-index: 1000;
      }

      .dropdown-header {
        padding: 1rem;
      }

      .dropdown-user-name {
        font-weight: 600;
        color: #1e293b;
      }

      .dropdown-user-email {
        font-size: 0.875rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .dropdown-user-role {
        font-size: 0.75rem;
        color: #3b82f6;
        margin-top: 0.25rem;
        text-transform: uppercase;
        font-weight: 600;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        transition: background 0.2s;
        color: #1e293b;
      }

      .dropdown-item:hover {
        background: #f3f4f6;
      }

      .dropdown-item.danger {
        color: #ef4444;
      }

      .dropdown-item.danger:hover {
        background: #fee2e2;
      }

      .admin-content {
        flex: 1;
        overflow-y: auto;
        background: #f9fafb;
        padding: 2rem;
      }

      @media (max-width: 768px) {
        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 1000;
        }

        .menu-collapsed .admin-sidebar {
          transform: translateX(-100%);
        }
      }
    `,
  ],
})
export class AdminShellComponent {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(AdminMenuService);
  private readonly router = inject(Router);

  // Estado del UI
  readonly isMenuCollapsed = computed(() => this.menuService.isCollapsed());
  readonly menuConfig = computed(() => this.menuService.menuConfig());
  readonly menuItems = computed(() => this.menuService.filteredMenu());

  // Información del usuario
  readonly userClaims = computed(() => this.authService.claims);
  readonly userName = computed(() => {
    const claims = this.userClaims();
    return claims?.name || claims?.email || 'Admin';
  });
  readonly userEmail = computed(() => this.userClaims()?.email || '');
  readonly userRole = computed(() => this.userClaims()?.role || '');

  // Control de dropdowns
  readonly showUserMenu = signal(false);

  // Control de items expandidos (por defecto todos cerrados)
  private readonly expandedItems = signal<Set<string>>(new Set());

  /**
   * Toggle del menú lateral
   */
  toggleMenu(): void {
    this.menuService.toggleCollapse();
  }

  /**
   * Toggle del menú de usuario
   */
  toggleUserMenu(): void {
    this.showUserMenu.update((show) => !show);
  }

  /**
   * Navegar a una ruta
   */
  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.clear();
    this.router.navigate(['/login']);
  }

  /**
   * Expandir/colapsar item del menú
   */
  toggleMenuItem(itemId: string): void {
    this.expandedItems.update((items) => {
      const newSet = new Set(items);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  /**
   * Verificar si un item está expandido
   */
  isItemExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  /**
   * Verificar si una ruta está activa
   */
  isRouteActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url.startsWith(route);
  }
}
