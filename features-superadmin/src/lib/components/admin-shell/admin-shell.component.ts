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
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
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
    return claims?.email || 'Admin';
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
    this.router.navigate(['/admin/login']);
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
