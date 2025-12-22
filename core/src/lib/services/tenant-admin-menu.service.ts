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
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/tenant-admin/dashboard',
      order: 1,
    },
    catalog: {
      label: 'Categorías',
      icon: 'inventory_2',
      route: '/tenant-admin/catalog',
      order: 2,
    },
    orders: {
      label: 'Pedidos',
      icon: 'shopping_cart',
      route: '/tenant-admin/orders',
      order: 3,
    },
    customers: {
      label: 'Clientes',
      icon: 'people',
      route: '/tenant-admin/customers',
      order: 4,
    },
    loyalty: {
      label: 'Programa de Lealtad',
      icon: 'star',
      route: '/tenant-admin/loyalty',
      order: 5,
    },
    // Settings es el módulo padre
    settings: {
      label: 'Configuración',
      icon: 'settings',
      order: 6,
      // No tiene route porque es un padre con hijos
    },
    // Submódulos de settings
    'settings.general': {
      label: 'General',
      icon: 'settings_applications',
      route: '/tenant-admin/settings/general',
      order: 1,
      parentModule: 'settings',
    },
    'settings.branding': {
      label: 'Marca',
      icon: 'palette',
      route: '/tenant-admin/settings/branding',
      order: 2,
      parentModule: 'settings',
    },
    'settings.payments': {
      label: 'Pagos',
      icon: 'payment',
      route: '/tenant-admin/settings/payments',
      order: 3,
      parentModule: 'settings',
    },
    'settings.shipping': {
      label: 'Envíos',
      icon: 'local_shipping',
      route: '/tenant-admin/settings/shipping',
      order: 4,
      parentModule: 'settings',
    },
    permissions: {
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

    console.log('[TenantAdminMenuService] Computing menu');
    console.log('[TenantAdminMenuService] Claims:', claims);

    if (!claims) {
      console.log('[TenantAdminMenuService] No claims - returning empty menu');
      return [];
    }

    // Obtener módulos desde el array del JWT
    const modules = claims.modules || [];
    console.log('[TenantAdminMenuService] Modules:', modules);

    // Si no hay módulos definidos, mostrar todos los módulos disponibles
    if (modules.length === 0) {
      console.log(
        '[TenantAdminMenuService] No modules restriction - showing all modules'
      );
      // Incluir tanto módulos principales como submódulos
      const allModules = Object.keys(this.moduleConfigMap);
      return this.buildMenuFromModules(allModules);
    }

    const menu = this.buildMenuFromModules(modules);
    console.log('[TenantAdminMenuService] Built menu:', menu);

    return menu;
  });

  /**
   * 🏗️ Construye el menú a partir del array de módulos permitidos
   *
   * @param modules - Array de códigos de módulo (ej: ["catalog", "orders", "customers", "settings"])
   */
  private buildMenuFromModules(modules: string[]): TenantAdminMenuItem[] {
    console.log(
      '[TenantAdminMenuService] Building menu from modules:',
      modules
    );

    // Separar módulos principales de submódulos
    const mainModules = modules.filter((m) => !m.includes('.'));
    const subModules = modules.filter((m) => m.includes('.'));

    console.log('[TenantAdminMenuService] Main modules:', mainModules);
    console.log('[TenantAdminMenuService] Sub modules:', subModules);

    // Construir items del menú
    const menuItems: TenantAdminMenuItem[] = [];

    // Procesar módulos principales
    for (const moduleCode of mainModules) {
      const config = this.moduleConfigMap[moduleCode.toLowerCase()];

      if (!config) {
        console.warn(
          `[TenantAdminMenuService] Module not found in config: ${moduleCode}`
        );
        continue;
      }

      const menuItem: TenantAdminMenuItem = {
        id: moduleCode.toLowerCase(),
        label: config.label,
        icon: config.icon,
        route: config.route,
        visible: true,
      };

      // Si es "settings", buscar sus submódulos
      if (moduleCode.toLowerCase() === 'settings') {
        const settingsSubModules = subModules
          .filter((sm) => sm.toLowerCase().startsWith('settings.'))
          .map((sm) => {
            const subConfig = this.moduleConfigMap[sm.toLowerCase()];
            if (!subConfig) return null;

            return {
              id: sm.toLowerCase(),
              label: subConfig.label,
              icon: subConfig.icon,
              route: subConfig.route,
              visible: true,
            } as TenantAdminMenuItem;
          })
          .filter((item): item is TenantAdminMenuItem => item !== null)
          .sort((a, b) => {
            const orderA = this.moduleConfigMap[a.id]?.order ?? 999;
            const orderB = this.moduleConfigMap[b.id]?.order ?? 999;
            return orderA - orderB;
          });

        // Solo agregar el módulo settings si tiene hijos
        if (settingsSubModules.length > 0) {
          menuItem.children = settingsSubModules;
          menuItems.push(menuItem);
        }
      } else {
        // Módulos normales sin hijos
        menuItems.push(menuItem);
      }
    }

    // Ordenar por el orden configurado
    menuItems.sort((a, b) => {
      const orderA = this.moduleConfigMap[a.id]?.order ?? 999;
      const orderB = this.moduleConfigMap[b.id]?.order ?? 999;
      return orderA - orderB;
    });

    return menuItems;
  }

  /**
   * ✅ Verifica si el usuario tiene acceso a un módulo específico
   *
   * @param moduleCode - Código del módulo a verificar (puede incluir submódulo como "settings.general")
   */
  canPerformAction(moduleCode: string): boolean {
    const claims = this.authService.claims;

    if (!claims) return false;

    const modules = claims.modules || [];

    // Si el array está vacío, se asume acceso completo a todos los módulos
    if (modules.length === 0) {
      return true;
    }

    const lowerModuleCode = moduleCode.toLowerCase();

    // Verificar acceso directo al módulo
    if (modules.includes(lowerModuleCode)) {
      return true;
    }

    // Si es un submódulo (ej: "settings.general"), verificar si el padre está permitido
    if (lowerModuleCode.includes('.')) {
      const parentModule = lowerModuleCode.split('.')[0];
      return modules.includes(parentModule);
    }

    return false;
  }

  /**
   * 📊 Obtiene los módulos disponibles para el usuario
   */
  getAvailableModules(): string[] {
    const claims = this.authService.claims;
    const modules = claims?.modules || [];

    // Si no hay módulos, retornar todos los disponibles
    if (modules.length === 0) {
      return Object.keys(this.moduleConfigMap);
    }

    return modules;
  }

  /**
   * 👤 Verifica si el usuario es administrador del tenant (empleado)
   *
   * Usuario es admin del tenant si tiene CUALQUIER rol que NO sea Customer
   */
  isTenantAdmin(): boolean {
    const claims = this.authService.claims;
    if (!claims?.roles || claims.roles.length === 0) return false;

    // Si tiene cualquier rol que no sea Customer, es empleado/admin
    return claims.roles.some((role) => role.toLowerCase() !== 'customer');
  }

  /**
   * 🛒 Verifica si el usuario es SOLO un cliente (sin roles de empleado)
   */
  isCustomer(): boolean {
    const claims = this.authService.claims;
    if (!claims?.roles || claims.roles.length === 0) return false;

    // Es customer si SOLO tiene el rol Customer
    return (
      claims.roles.length === 1 && claims.roles[0].toLowerCase() === 'customer'
    );
  }
}
