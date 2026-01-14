/**
 * 🎯 Servicio de Menú Administrativo para Usuarios Tenant
 *
 * Construye el menú dinámico basado en los módulos permitidos del usuario.
 *
 * Este servicio es para administradores DE UN TENANT ESPECÍFICO,
 * no para el SuperAdmin general.
 */

import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Estructura de un item del menú de administración del tenant
 */
export interface TenantAdminMenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  badge?: { text: string; color: string };
  children?: TenantAdminMenuItem[];
  divider?: boolean;
  visible: boolean;
}

/**
 * Configuración de cada módulo del menú
 */
interface ModuleConfig {
  module: string; // Código del módulo para validar permisos
  label: string;
  icon: string;
  route?: string;
  order: number;
  parentModule?: string; // Indica si es un submódulo
}

@Injectable({ providedIn: 'root' })
export class TenantAdminMenuService {
  private readonly authService = inject(AuthService);

  /**
   * 📋 Mapeo de códigos de módulo a configuración de menú
   * Coincide con los módulos del backend
   */
  private readonly moduleConfigMap: Record<string, ModuleConfig> = {
    dashboard: {
      module: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/tenant-admin/dashboard',
      order: 1,
    },
    // Catálogo es el módulo padre
    catalog: {
      module: 'catalog',
      label: 'Catálogo',
      icon: 'inventory_2',
      order: 2,
    },

    'catalog.categories': {
      module: 'catalog',
      label: 'Categorías',
      icon: 'category',
      route: '/tenant-admin/catalog/categories',
      order: 1,
      parentModule: 'catalog',
    },
    'catalog.products': {
      module: 'catalog',
      label: 'Productos',
      icon: 'inventory',
      route: '/tenant-admin/catalog/products',
      order: 2,
      parentModule: 'catalog',
    },
    orders: {
      module: 'orders',
      label: 'Pedidos',
      icon: 'shopping_cart',
      route: '/tenant-admin/orders',
      order: 3,
    },
    customers: {
      module: 'customers',
      label: 'Clientes',
      icon: 'people',
      route: '/tenant-admin/customers',
      order: 4,
    },
    loyalty: {
      module: 'loyalty',
      label: 'Programa de Lealtad',
      icon: 'star',
      route: '/tenant-admin/loyalty',
      order: 5,
    },
    // Settings es el módulo padre
    settings: {
      module: 'settings',
      label: 'Configuración',
      icon: 'settings',
      order: 6,
      // No tiene route porque es un padre con hijos
    },
    // Submódulos de settings
    'settings.general': {
      module: 'settings.general',
      label: 'General',
      icon: 'settings_applications',
      route: '/tenant-admin/settings/general',
      order: 1,
      parentModule: 'settings',
    },
    'settings.branding': {
      module: 'settings.branding',
      label: 'Marca',
      icon: 'palette',
      route: '/tenant-admin/settings/branding',
      order: 2,
      parentModule: 'settings',
    },
    'settings.payments': {
      module: 'settings.payments',
      label: 'Pagos',
      icon: 'payment',
      route: '/tenant-admin/settings/payments',
      order: 3,
      parentModule: 'settings',
    },
    'settings.shipping': {
      module: 'settings.shipping',
      label: 'Envíos',
      icon: 'local_shipping',
      route: '/tenant-admin/settings/shipping',
      order: 4,
      parentModule: 'settings',
    },
    permissions: {
      module: 'permissions',
      label: 'Permisos',
      icon: 'security',
      route: '/tenant-admin/permissions',
      order: 7,
    },
  };

  /**
   * 🔍 Computed signal que devuelve el menú filtrado según módulos del usuario
   *
   * Se recalcula automáticamente cuando cambian los claims del AuthService
   */
  readonly menu = computed(() => {
    const claims = this.authService.claims;

    if (!claims) {
      return [];
    }

    // Obtener módulos desde el array del JWT
    const modules = claims.modules || [];

    // Si no hay módulos definidos, mostrar todos los módulos disponibles
    if (modules.length === 0) {
      // Incluir tanto módulos principales como submódulos
      const allModules = Object.keys(this.moduleConfigMap);
      return this.buildMenuFromModules(allModules);
    }

    const menu = this.buildMenuFromModules(modules);

    return menu;
  });

  private buildMenuFromModules(modules: string[]): TenantAdminMenuItem[] {
    const mainModules = modules.filter((m) => !m.includes('.'));
    const subModules = modules.filter((m) => m.includes('.'));

    const menuItems: TenantAdminMenuItem[] = [];

    for (const moduleCode of mainModules) {
      const config = this.moduleConfigMap[moduleCode.toLowerCase()];

      if (!config) {
        continue;
      }

      const menuItem: TenantAdminMenuItem = {
        id: moduleCode.toLowerCase(),
        label: config.label,
        icon: config.icon,
        route: config.route,
        visible: true,
      };

      if (moduleCode.toLowerCase() === 'catalog') {
        const catalogSubModules = Object.keys(this.moduleConfigMap)
          .filter((key) => key.startsWith('catalog.'))
          .map((key) => {
            const subConfig = this.moduleConfigMap[key];
            return {
              id: key,
              label: subConfig.label,
              icon: subConfig.icon,
              route: subConfig.route,
              visible: true,
            } as TenantAdminMenuItem;
          })
          .sort((a, b) => {
            const orderA = this.moduleConfigMap[a.id]?.order ?? 999;
            const orderB = this.moduleConfigMap[b.id]?.order ?? 999;
            return orderA - orderB;
          });

        if (catalogSubModules.length > 0) {
          menuItem.children = catalogSubModules;
          menuItems.push(menuItem);
        }
      }
      // Si es "settings", incluir automáticamente sus submódulos
      else if (moduleCode.toLowerCase() === 'settings') {
        // Buscar todos los submódulos de settings definidos en moduleConfigMap
        const settingsSubModules = Object.keys(this.moduleConfigMap)
          .filter((key) => key.startsWith('settings.'))
          .map((key) => {
            const subConfig = this.moduleConfigMap[key];
            return {
              id: key,
              label: subConfig.label,
              icon: subConfig.icon,
              route: subConfig.route,
              visible: true,
            } as TenantAdminMenuItem;
          })
          .sort((a, b) => {
            const orderA = this.moduleConfigMap[a.id]?.order ?? 999;
            const orderB = this.moduleConfigMap[b.id]?.order ?? 999;
            return orderA - orderB;
          });

        if (settingsSubModules.length > 0) {
          menuItem.children = settingsSubModules;
          menuItems.push(menuItem);
        }
      } else {
        // Módulos normales sin hijos
        menuItems.push(menuItem);
      }
    }

    menuItems.sort((a, b) => {
      const orderA = this.moduleConfigMap[a.id]?.order ?? 999;
      const orderB = this.moduleConfigMap[b.id]?.order ?? 999;
      return orderA - orderB;
    });

    return menuItems;
  }

  canPerformAction(moduleCode: string): boolean {
    const claims = this.authService.claims;

    if (!claims) return false;

    const modules = claims.modules || [];

    if (modules.length === 0) {
      return true;
    }

    const lowerModuleCode = moduleCode.toLowerCase();

    if (modules.includes(lowerModuleCode)) {
      return true;
    }

    if (lowerModuleCode.includes('.')) {
      const parentModule = lowerModuleCode.split('.')[0];
      return modules.includes(parentModule);
    }

    return false;
  }

  getAvailableModules(): string[] {
    const claims = this.authService.claims;
    const modules = claims?.modules || [];

    if (modules.length === 0) {
      return Object.keys(this.moduleConfigMap);
    }

    return modules;
  }

  isTenantAdmin(): boolean {
    const claims = this.authService.claims;
    if (!claims?.roles || claims.roles.length === 0) return false;

    return claims.roles.some((role) => role.toLowerCase() !== 'customer');
  }

  isCustomer(): boolean {
    const claims = this.authService.claims;
    if (!claims?.roles || claims.roles.length === 0) return false;

    return (
      claims.roles.length === 1 && claims.roles[0].toLowerCase() === 'customer'
    );
  }
}
