/**
 * 🎯 Servicio de Menú Administrativo
 *
 * Gestiona el menú lateral del módulo superadmin de forma dinámica,
 * filtrando los items según los permisos y roles del usuario autenticado.
 *
 * Features:
 * - Menú dinámico basado en permisos del JWT
 * - Soporte para items anidados (jerarquía)
 * - Signals de Angular para reactividad
 * - Cache inteligente para evitar recálculos
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@pwa/core';
import { ADMIN_PERMISSIONS } from '../models/admin-auth.model';
import { AdminMenuConfig, AdminMenuItem } from '../models/admin-menu.model';

@Injectable({
  providedIn: 'root',
})
export class AdminMenuService {
  private readonly authService = inject(AuthService);

  // Estado del menú
  private readonly _isCollapsed = signal<boolean>(false);
  private readonly _activeItemId = signal<string | null>(null);

  // Signals públicos
  readonly isCollapsed = computed(() => this._isCollapsed());
  readonly activeItemId = computed(() => this._activeItemId());

  /**
   * 📋 Definición del menú base del administrador general
   *
   * Este menú se filtra dinámicamente según los permisos del usuario.
   * Los items sin requiredPermissions son visibles para todos.
   */
  private readonly baseMenuItems: AdminMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
      order: 1,
    },
    {
      id: 'tenants',
      label: 'Negocios (eCommerce)',
      icon: 'storefront',
      order: 2,
      expanded: false,
      children: [
        {
          id: 'tenants-list',
          label: 'Todos los Negocios',
          icon: 'store',
          route: '/admin/tenants',
          requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.VIEW],
        },
        {
          id: 'tenants-create',
          label: 'Crear Negocio',
          icon: 'add_business',
          route: '/admin/tenants/create',
          requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.CREATE],
        },
        {
          id: 'tenants-config',
          label: 'Configuraciones',
          icon: 'settings',
          route: '/admin/tenants/config',
          requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.CONFIGURE],
        },
      ],
    },
    {
      id: 'users',
      label: 'Gestión de Usuarios',
      icon: 'people',
      order: 3,
      expanded: false,
      children: [
        {
          id: 'users-list',
          label: 'Todos los Usuarios',
          icon: 'list',
          route: '/admin/users',
          requiredPermissions: [ADMIN_PERMISSIONS.USERS.VIEW],
        },
        {
          id: 'users-roles',
          label: 'Roles y Permisos',
          icon: 'admin_panel_settings',
          route: '/admin/users/roles',
          requiredPermissions: [ADMIN_PERMISSIONS.USERS.MANAGE_ROLES],
        },
      ],
    },
    {
      id: 'subscriptions',
      label: 'Subscripciones',
      icon: 'card_membership',
      route: '/admin/subscriptions',
      order: 4,
      requiredPermissions: [ADMIN_PERMISSIONS.SUBSCRIPTIONS.VIEW],
    },
    {
      id: 'billing',
      label: 'Facturación',
      icon: 'receipt_long',
      route: '/admin/billing',
      order: 5,
      requiredPermissions: [ADMIN_PERMISSIONS.BILLING.VIEW],
      badge: {
        text: 'PRO',
        color: 'accent',
      },
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'analytics',
      route: '/admin/analytics',
      order: 6,
      requiredPermissions: [ADMIN_PERMISSIONS.ANALYTICS.VIEW],
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: 'settings_applications',
      order: 7,
      expanded: false,
      showDivider: true,
      children: [
        {
          id: 'system-config',
          label: 'Configuración Global',
          icon: 'tune',
          route: '/admin/system/config',
          requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.VIEW_CONFIG],
        },
        {
          id: 'system-features',
          label: 'Feature Flags',
          icon: 'flag',
          route: '/admin/system/features',
          requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.MANAGE_FEATURES],
        },
        {
          id: 'system-logs',
          label: 'Logs del Sistema',
          icon: 'description',
          route: '/admin/system/logs',
          requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.VIEW_LOGS],
        },
      ],
    },
  ];

  /**
   * 🔍 Computed signal que devuelve el menú filtrado según permisos
   *
   * Se recalcula automáticamente cuando cambian los claims del AuthService
   */
  readonly filteredMenu = computed(() => {
    const claims = this.authService.claims;

    if (!claims) {
      return []; // Usuario no autenticado
    }

    // Usar el nuevo sistema de roles (array) o detectar desde 'admin' flag
    const roles = claims.roles || [];
    const modules = claims.modules || [];
    const isAdminFlag = claims.admin === 'true' || claims.admin === true;

    // Caso especial: usuarios con rol SUPER_ADMIN o admin flag tienen acceso completo al menú
    if (this.isSuperAdmin(roles, modules, isAdminFlag)) {
      const fullMenu = this.sortMenuItems(this.baseMenuItems);
      return fullMenu;
    }

    // Filtrar recursivamente según permisos
    return this.sortMenuItems(
      this.filterMenuItems(this.baseMenuItems, roles, modules)
    );
  });

  /**
   * 📊 Configuración completa del menú
   */
  readonly menuConfig = computed<AdminMenuConfig>(() => ({
    items: this.filteredMenu(),
    collapsed: this._isCollapsed(),
    expandedWidth: 280,
    collapsedWidth: 64,
    position: 'left',
  }));

  /**
   * Alterna el estado colapsado del menú
   */
  toggleCollapse(): void {
    this._isCollapsed.update((collapsed) => !collapsed);
  }

  /**
   * Establece el item activo del menú
   */
  setActiveItem(itemId: string): void {
    this._activeItemId.set(itemId);
  }

  /**
   * Colapsa el menú
   */
  collapse(): void {
    this._isCollapsed.set(true);
  }

  /**
   * Expande el menú
   */
  expand(): void {
    this._isCollapsed.set(false);
  }

  /**
   * 🔒 Filtra los items del menú según permisos y roles
   */
  private filterMenuItems(
    items: AdminMenuItem[],
    userRole: string | string[] | undefined,
    userModules: string[] | undefined
  ): AdminMenuItem[] {
    return items
      .filter((item) => this.hasAccess(item, userRole, userModules))
      .map((item) => {
        // Si tiene hijos, filtrar recursivamente
        if (item.children && item.children.length > 0) {
          const filteredChildren = this.filterMenuItems(
            item.children,
            userRole,
            userModules
          );

          // Solo incluir el item padre si tiene hijos visibles
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item): item is AdminMenuItem => item !== null);
  }

  /**
   * 🔐 Verifica si el usuario tiene acceso a un item del menú
   */
  private hasAccess(
    item: AdminMenuItem,
    userRole: string | string[] | undefined,
    userModules: string[] | undefined
  ): boolean {
    // Si el item está deshabilitado, no mostrar
    if (item.disabled) {
      return false;
    }

    // Si no requiere permisos ni roles, es público (dentro del admin)
    if (
      (!item.requiredPermissions || item.requiredPermissions.length === 0) &&
      (!item.requiredRoles || item.requiredRoles.length === 0)
    ) {
      return true;
    }

    // Normalizar el rol del usuario (puede ser string o array)
    const roleStr = Array.isArray(userRole) ? userRole[0] : userRole;
    const normalizedUserRole = roleStr?.toLowerCase().replaceAll('_', '');

    // Verificar roles (lógica OR: al menos uno)
    if (
      item.requiredRoles &&
      item.requiredRoles.length > 0 &&
      normalizedUserRole
    ) {
      const normalizedRequired = item.requiredRoles.map((r) =>
        r.toLowerCase().replaceAll('_', '')
      );
      if (normalizedRequired.includes(normalizedUserRole)) {
        return true;
      }
    }

    // Verificar permisos (ahora basado en módulos)
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.every((permission) =>
        userModules?.includes(permission)
      );
    }

    return false;
  }

  /**
   * 👑 Verifica si el usuario es SUPER_ADMIN
   */
  /**
   * 🔐 Verifica si un usuario tiene rol de SuperAdmin
   * @param userRole - Rol del usuario (puede ser string o array)
   * @param userModules - Módulos del usuario (nuevo sistema de permisos)
   * @param isAdminFlag - Flag directo de admin desde el token
   */
  private isSuperAdmin(
    userRole: string | string[] | undefined,
    userModules: string[] | undefined,
    isAdminFlag?: boolean
  ): boolean {
    // Si tiene el flag de admin directo, es SuperAdmin
    if (isAdminFlag) {
      return true;
    }

    // Si role es array, tomar el primer elemento
    const roleStr = Array.isArray(userRole) ? userRole[0] : userRole;

    // Normalizar el rol para soportar variantes: SuperAdmin, SUPER_ADMIN, super_admin
    const normalizedRole = roleStr?.toLowerCase().replaceAll('_', '');
    return normalizedRole === 'superadmin' || false;
  }

  /**
   * 📊 Ordena los items del menú por el campo order
   */
  private sortMenuItems(items: AdminMenuItem[]): AdminMenuItem[] {
    const sorted = [...items].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999)
    );
    return sorted.map((item) => {
      if (item.children) {
        return {
          ...item,
          children: this.sortMenuItems(item.children),
        };
      }
      return item;
    });
  }

  /**
   * 🔍 Busca un item del menú por su ID (recursivo)
   */
  findMenuItem(itemId: string, items?: AdminMenuItem[]): AdminMenuItem | null {
    const menuItems = items || this.filteredMenu();

    for (const item of menuItems) {
      if (item.id === itemId) {
        return item;
      }

      if (item.children) {
        const found = this.findMenuItem(itemId, item.children);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * 📍 Obtiene el path completo de un item (para breadcrumbs)
   */
  getMenuPath(itemId: string): AdminMenuItem[] {
    const path: AdminMenuItem[] = [];
    this.findMenuPath(itemId, this.filteredMenu(), path);
    return path;
  }

  private findMenuPath(
    itemId: string,
    items: AdminMenuItem[],
    path: AdminMenuItem[]
  ): boolean {
    for (const item of items) {
      path.push(item);

      if (item.id === itemId) {
        return true;
      }

      if (item.children && this.findMenuPath(itemId, item.children, path)) {
        return true;
      }

      path.pop();
    }

    return false;
  }
}
