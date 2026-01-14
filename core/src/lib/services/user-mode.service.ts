/**
 * 👤 Servicio de Modo de Usuario
 *
 * Gestiona si el usuario está navegando como "Cliente" o como "Empleado"
 * cuando tiene múltiples roles (Customer + otros roles).
 *
 * Casos de uso:
 * - Usuario solo con role "Customer" → siempre en modo "customer"
 * - Usuario con múltiples roles → puede elegir entre "customer" o "employee"
 * - Usuario sin role "Customer" → siempre en modo "employee"
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export type UserMode = 'customer' | 'employee';

@Injectable({ providedIn: 'root' })
export class UserModeService {
  private readonly authService = inject(AuthService);

  // Modo actual seleccionado por el usuario
  private readonly _selectedMode = signal<UserMode | null>(null);

  /**
   * Modo actualmente seleccionado
   */
  readonly selectedMode = computed(() => this._selectedMode());

  /**
   * Verifica si el usuario tiene solo el role "Customer"
   */
  readonly isCustomerOnly = computed(() => {
    const claims = this.authService.claims;
    if (!claims?.roles || claims.roles.length === 0) return false;

    return (
      claims.roles.length === 1 && claims.roles[0].toLowerCase() === 'customer'
    );
  });

  /**
   * Verifica si el usuario tiene múltiples roles (Customer + otros)
   */
  readonly hasMultipleRoles = computed(() => {
    const claims = this.authService.claims;
    if (!claims?.roles || claims.roles.length <= 1) return false;

    const hasCustomer = claims.roles.some(
      (role) => role.toLowerCase() === 'customer'
    );
    return hasCustomer && claims.roles.length > 1;
  });

  /**
   * Verifica si el usuario tiene role Customer
   */
  readonly hasCustomerRole = computed(() => {
    const claims = this.authService.claims;
    return (
      claims?.roles?.some((role) => role.toLowerCase() === 'customer') ?? false
    );
  });

  /**
   * Verifica si el usuario tiene roles de empleado (no Customer)
   */
  readonly hasEmployeeRoles = computed(() => {
    const claims = this.authService.claims;
    if (!claims?.roles) return false;

    return claims.roles.some((role) => role.toLowerCase() !== 'customer');
  });

  /**
   * Determina si debe mostrarse el popup de selección de modo
   */
  readonly shouldShowModeSelector = computed(() => {
    // Solo mostrar si tiene múltiples roles y aún no ha seleccionado
    return this.hasMultipleRoles() && this._selectedMode() === null;
  });

  /**
   * Modo efectivo actual (considerando auto-selección)
   */
  readonly effectiveMode = computed(() => {
    // Si ya seleccionó explícitamente
    if (this._selectedMode()) {
      return this._selectedMode();
    }

    // Auto-seleccionar según roles
    if (this.isCustomerOnly()) {
      return 'customer';
    }

    if (!this.hasCustomerRole()) {
      return 'employee';
    }

    // Múltiples roles sin selección → null (debe elegir)
    return null;
  });

  /**
   * Verifica si está navegando como cliente
   */
  readonly isCustomerMode = computed(() => this.effectiveMode() === 'customer');

  /**
   * Verifica si está navegando como empleado
   */
  readonly isEmployeeMode = computed(() => this.effectiveMode() === 'employee');

  /**
   * Establece el modo de navegación
   */
  setMode(mode: UserMode): void {
    this._selectedMode.set(mode);
    this.saveToStorage(mode);
  }

  /**
   * Cambia entre modos
   */
  toggleMode(): void {
    const current = this.effectiveMode();
    const newMode: UserMode = current === 'customer' ? 'employee' : 'customer';
    this.setMode(newMode);
  }

  /**
   * Resetea el modo seleccionado (fuerza a elegir nuevamente)
   */
  resetMode(): void {
    this._selectedMode.set(null);
    this.clearStorage();
  }

  /**
   * Inicializa el servicio cargando el modo desde localStorage
   */
  init(): void {
    const stored = this.loadFromStorage();
    if (stored) {
      this._selectedMode.set(stored);
    }
  }

  /**
   * Limpia el modo al hacer logout
   */
  clear(): void {
    this._selectedMode.set(null);
    this.clearStorage();
  }

  // === Storage ===

  private readonly STORAGE_KEY = 'user_mode';

  private saveToStorage(mode: UserMode): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, mode);
    }
  }

  private loadFromStorage(): UserMode | null {
    if (typeof localStorage === 'undefined') return null;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'customer' || stored === 'employee') {
      return stored;
    }

    return null;
  }

  private clearStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
