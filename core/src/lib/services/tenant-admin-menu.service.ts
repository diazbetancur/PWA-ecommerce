/**
 * 🎯 Servicio de Menú Administrativo para Usuarios Tenant
 *
 * Convierte los permisos de módulo (ModulePermission) recibidos del backend
 * en un menú administrativo dinámico basado en los permisos del usuario.
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
 * Mapeo de módulos del backend a configuración del menú
 */
interface MenuModuleConfig {
  label: string;
  icon: string;
  route: string;
  order: number;
  parentModule?: string; // Para agrupar bajo un padre
}

@Injectable({ providedIn: 'root' })
export class TenantAdminMenuService {
  private readonly authService = inject(AuthService);

  /**
   * 📋 Mapeo de códigos de módulo a configuración de menú
   *
   * Ajusta este mapeo según los módulos de tu backend
   */
  private readonly moduleConfigMap: Record<string, MenuModuleConfig> = {
    PRODUCTS: {
      label: 'Productos',
      icon: 'inventory_2',
      route: '/tenant-admin/products',
      order: 2,
      parentModule: 'CONFIG',
    },
    CATEGORIES: {
      label: 'Categorías',
      icon: 'category',
      route: '/tenant-admin/categories',
      order: 1,
      parentModule: 'CONFIG',
    },
    BANNERS: {
      label: 'Banners',
      icon: 'image',
      route: '/tenant-admin/banners',
      order: 3,
      parentModule: 'CONFIG',
    },
    ORDERS: {
      label: 'Ventas',
      icon: 'shopping_cart',
      route: '/tenant-admin/orders',
      order: 4,
    },
    METRICS: {
      label: 'Métricas',
      icon: 'analytics',
      route: '/tenant-admin/metrics',
      order: 5,
    },
    CUSTOMERS: {
      label: 'Clientes',
      icon: 'people',
      route: '/tenant-admin/customers',
      order: 6,
    },
    SETTINGS: {
      label: 'Configuración General',
      icon: 'settings',
      route: '/tenant-admin/settings',
      order: 7,
    },
  };

  /**
   * 🔍 Computed signal que devuelve el menú filtrado según permisos del usuario
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

    // NUEVO: Obtener módulos desde el array 'modules' del JWT
    // Formato: ["products", "categories", "banners"]
    const allowedModules = claims.modules || [];
    console.log('[TenantAdminMenuService] Allowed modules:', allowedModules);

    const menu = this.buildMenuFromModules(allowedModules);
    console.log('[TenantAdminMenuService] Built menu:', menu);

    return menu;
  });

  /**
   * 🏗️ Construye el menú a partir del array de módulos permitidos
   *
   * @param modules - Array de códigos de módulo (ej: ["products", "categories"])
   *                  Si está vacío [] = todos los módulos disponibles
   */
  private buildMenuFromModules(modules: string[]): TenantAdminMenuItem[] {
    console.log(
      '[TenantAdminMenuService] Building menu from modules:',
      modules
    );
    console.log(
      '[TenantAdminMenuService] Empty modules array = ALL modules available'
    );

    const menuItems: TenantAdminMenuItem[] = [];
    const configChildren: TenantAdminMenuItem[] = [];

    // Si modules está vacío, mostrar TODOS los módulos
    const showAllModules = modules.length === 0;
    console.log('[TenantAdminMenuService] Show all modules:', showAllModules);

    // Filtrar módulos que están permitidos
    const visibleModules = Object.entries(this.moduleConfigMap)
      .filter(([code]) => {
        // Si debe mostrar todos, incluir todos
        if (showAllModules) return true;

        // Si no, solo los que están en el array
        const allowedModulesCodes = modules.map((m) => m.toUpperCase());
        return allowedModulesCodes.includes(code);
      })
      .map(([code, config]) => ({ moduleCode: code, ...config }));

    console.log(
      '[TenantAdminMenuService] Visible modules:',
      visibleModules.map((m) => m.moduleCode)
    );

    // Ordenar por el orden definido - crear nueva copia para no mutar
    const sortedModules = [...visibleModules].sort((a, b) => {
      return (a.order ?? 999) - (b.order ?? 999);
    });

    // Construir items del menú
    for (const module of sortedModules) {
      // Crear item del menú basado en la configuración
      const item: TenantAdminMenuItem = {
        id: module.moduleCode.toLowerCase(),
        label: module.label,
        icon: module.icon,
        route: module.route,
        visible: true,
      };

      // Si pertenece a un módulo padre (ej: CONFIG), agregarlo al grupo
      if (module.parentModule === 'CONFIG') {
        configChildren.push(item);
      } else {
        menuItems.push(item);
      }
    }

    // Si hay items de configuración, crear el grupo padre
    if (configChildren.length > 0) {
      menuItems.unshift({
        id: 'configuration',
        label: 'Configuración',
        icon: 'tune',
        children: configChildren,
        visible: true,
      });
    }

    return menuItems;
  }

  /**
   * 🔐 Verifica si el usuario puede realizar una acción en un módulo
   *
   * NOTA: Con la nueva estructura del token solo verificamos si el módulo está en la lista.
   * Los permisos granulares (view/create/update/delete) se controlan desde el backend.
   *
   * Si modules está vacío [] = ACCESO TOTAL a todos los módulos
   */
  canPerformAction(
    moduleCode: string,
    action: 'view' | 'create' | 'update' | 'delete'
  ): boolean {
    const claims = this.authService.claims;
    const allowedModules = claims?.modules || [];

    console.log('[TenantAdminMenuService] canPerformAction', {
      moduleCode,
      action,
      allowedModules,
      isEmpty: allowedModules.length === 0,
    });

    // Si el array está vacío, tiene acceso a TODOS los módulos
    if (allowedModules.length === 0) {
      console.log('[TenantAdminMenuService] Empty modules = FULL ACCESS');
      return true;
    }

    // Verificar si el módulo está en la lista de permitidos
    const hasAccess = allowedModules.some(
      (m) => m.toUpperCase() === moduleCode.toUpperCase()
    );

    console.log('[TenantAdminMenuService] Has access:', hasAccess);
    return hasAccess;
  }

  /**
   * 📊 Obtiene los módulos disponibles para el usuario
   */
  getAvailableModules(): string[] {
    const claims = this.authService.claims;
    return claims?.modules || [];
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
