import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, JwtPayload, UserProfile } from '../models/types';
import { ApiClientService } from '../services/api-client.service';
import { TenantConfigService } from '../services/tenant-config.service';

const STORAGE_PREFIX = 'mtkn_';
const SUPERADMIN_TOKEN_KEY = 'superadmin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly _jwt = signal<string | null>(null);
  private readonly _claims = signal<JwtPayload | null>(null);
  private readonly _isSuperAdmin = signal<boolean>(false);
  private _tenantSlug: string | null = null;

  init(tenantSlug: string) {
    this._tenantSlug = tenantSlug;
    const token = globalThis.localStorage?.getItem(STORAGE_PREFIX + tenantSlug);
    if (token) this.setToken(token);
  }

  initSuperAdmin() {
    this._tenantSlug = null;
    this._isSuperAdmin.set(true);
    const token = globalThis.localStorage?.getItem(SUPERADMIN_TOKEN_KEY);
    if (token) this.setToken(token);
  }

  setToken(token: string) {
    this._jwt.set(token);
    try {
      const base64 = token.split('.')[1];
      const json = globalThis.atob(base64);
      const claims = JSON.parse(json);
      this._claims.set(claims);

      const roleStr = Array.isArray(claims.roles)
        ? claims.roles[0]
        : claims.roles;
      const normalizedRole = roleStr?.toLowerCase().replaceAll('_', '');
      const isSuperAdmin =
        claims.isSuperAdmin === true || normalizedRole === 'superadmin';
      this._isSuperAdmin.set(isSuperAdmin);
    } catch {
      this._claims.set(null);
      this._isSuperAdmin.set(false);
    }

    if (this._isSuperAdmin()) {
      globalThis.localStorage?.setItem(SUPERADMIN_TOKEN_KEY, token);
      // TAMBIÉN guardar con el tenant_slug del JWT si existe (para que TenantBootstrap lo encuentre)
      const tenantSlugFromJwt = this._claims()?.tenant_slug;
      if (tenantSlugFromJwt) {
        const key = STORAGE_PREFIX + tenantSlugFromJwt;
        globalThis.localStorage?.setItem(key, token);
      }
    } else if (this._tenantSlug) {
      const key = STORAGE_PREFIX + this._tenantSlug;
      globalThis.localStorage?.setItem(key, token);
    }
  }

  clear() {
    this._jwt.set(null);
    this._claims.set(null);

    if (this._isSuperAdmin()) {
      globalThis.localStorage?.removeItem(SUPERADMIN_TOKEN_KEY);
    } else if (this._tenantSlug) {
      globalThis.localStorage?.removeItem(STORAGE_PREFIX + this._tenantSlug);
    }
    this._isSuperAdmin.set(false);
  }

  get token() {
    return this._jwt();
  }

  get claims() {
    return this._claims();
  }

  get isSuperAdmin() {
    return this._isSuperAdmin();
  }

  isAuthenticated() {
    const c = this._claims();
    return !!c && c.exp * 1000 > Date.now();
  }

  hasRole(role: string) {
    const roles = this._claims()?.roles;
    const roleStr = Array.isArray(roles) ? roles[0] : roles;
    return (
      roleStr?.toLowerCase().replaceAll('_', '') ===
      role.toLowerCase().replaceAll('_', '')
    );
  }

  /**
   * Verifica si el usuario tiene acceso a un módulo específico
   * @param module - Nombre del módulo (ej: 'products', 'categories')
   */
  hasPermission(module: string): boolean {
    const modules = this._claims()?.modules || [];
    return modules.some((m) => m.toLowerCase() === module.toLowerCase());
  }

  /**
   * Verifica si el usuario tiene acceso a todos los módulos especificados
   */
  hasAllPermissions(modules: string[]): boolean {
    const userModules = this._claims()?.modules || [];
    return modules.every((module) =>
      userModules.some((m) => m.toLowerCase() === module.toLowerCase())
    );
  }

  /**
   * Verifica si el usuario tiene acceso a alguno de los módulos especificados
   */
  hasAnyPermission(modules: string[]): boolean {
    const userModules = this._claims()?.modules || [];
    return modules.some((module) =>
      userModules.some((m) => m.toLowerCase() === module.toLowerCase())
    );
  }

  /**
   * Obtiene la lista de módulos permitidos para el usuario
   */
  getPermissions(): string[] {
    return this._claims()?.modules || [];
  }

  getRole(): string | undefined {
    const roles = this._claims()?.roles;
    return Array.isArray(roles) ? roles[0] : roles;
  }

  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<void> {
    // Verificar si hay tenant activo desde TenantConfigService
    const tenantSlug = this.tenantConfig.tenantSlug;
    const hasTenant = !!tenantSlug;
    const endpoint = hasTenant ? '/auth/login' : '/admin/auth/login';

    // Inicializar AuthService según el contexto
    if (!hasTenant) {
      this.initSuperAdmin();
    } else if (tenantSlug && !this._tenantSlug) {
      // Si hay tenant pero AuthService no está inicializado, inicializarlo
      this.init(tenantSlug);
    }

    const response = await firstValueFrom(
      this.apiClient.post<AuthResponse>(endpoint, {
        email: credentials.email,
        password: credentials.password,
      })
    );

    if (!response?.token) {
      throw new Error('No se recibió token del servidor');
    }

    this.setToken(response.token);

    // Guardar features del usuario en los claims (las features vienen en response.user.features)
    if (response.user?.features) {
      const currentClaims = this._claims();
      if (currentClaims) {
        this._claims.set({
          ...currentClaims,
          features: response.user.features,
        });
      }
    }
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<void> {
    // Verificar si tenemos tenant slug inicializado
    let tenantSlug = this._tenantSlug;
    
    // Si no está inicializado, intentar obtenerlo del TenantConfigService
    if (!tenantSlug) {
      const config = this.tenantConfig.config;
      if (config?.tenant?.slug) {
        tenantSlug = config.tenant.slug;
        // Inicializar el AuthService con el tenant slug
        this.init(tenantSlug);
      }
    }

    // Si aún no hay tenant slug, lanzar error
    if (!tenantSlug) {
      throw new Error('El registro requiere un comercio activo');
    }

    try {
      const response = await firstValueFrom(
        this.apiClient.post<AuthResponse>('/auth/register', data)
      );

      if (!response?.token) {
        throw new Error('No se recibió token del servidor');
      }

      this.setToken(response.token);
    } catch (error) {
      // Manejar errores HTTP específicos
      if (error instanceof HttpErrorResponse) {
        // Error 409: Email ya existe
        if (error.status === 409) {
          const detail = error.error?.detail || '';
          if (detail.includes('Email already registered')) {
            throw new Error('Este email ya está registrado. Por favor, inicia sesión o usa otro email.');
          }
          // Otros errores 409 (ej: Tenant no resuelto)
          throw new Error(detail || 'No se pudo completar el registro');
        }
        
        // Error 400: Validación
        if (error.status === 400) {
          const detail = error.error?.detail || 'Datos de registro inválidos';
          throw new Error(detail);
        }
        
        // Otros errores HTTP
        const detail = error.error?.detail || error.message || 'Error al registrar usuario';
        throw new Error(detail);
      }
      
      // Re-lanzar otros tipos de errores
      throw error;
    }
  }

  async getProfile(): Promise<UserProfile> {
    // Verificar si hay tenant activo
    const hasTenant = !!this.tenantConfig.tenantSlug;
    let endpoint = hasTenant ? '/auth/me' : '/admin/auth/me';

    // Agregar tenant como query parameter si está disponible
    if (hasTenant && this.tenantConfig.tenantSlug) {
      endpoint = `${endpoint}?tenant=${encodeURIComponent(
        this.tenantConfig.tenantSlug
      )}`;
    }

    return await firstValueFrom(this.apiClient.get<UserProfile>(endpoint));
  }
}
