import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, JwtPayload, UserProfile } from '../models/types';
import { ApiClientService } from '../services/api-client.service';

const STORAGE_PREFIX = 'mtkn_';
const SUPERADMIN_TOKEN_KEY = 'superadmin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiClient = inject(ApiClientService);

  private readonly _jwt = signal<string | null>(null);
  private readonly _claims = signal<JwtPayload | null>(null);
  private _tenantSlug: string | null = null;
  private readonly _isSuperAdmin = signal<boolean>(false);

  /**
   * Inicializa el servicio para un tenant específico
   */
  init(tenantSlug: string) {
    this._tenantSlug = tenantSlug;
    const token = globalThis.localStorage?.getItem(STORAGE_PREFIX + tenantSlug);
    if (token) this.setToken(token);
  }

  /**
   * Inicializa el servicio en modo superadmin (sin tenant)
   * Este método se usa cuando el usuario accede al panel de administración general
   */
  initSuperAdmin() {
    this._tenantSlug = null;
    this._isSuperAdmin.set(true);
    const token = globalThis.localStorage?.getItem(SUPERADMIN_TOKEN_KEY);
    if (token) {
      this.setToken(token);
    }
  }

  /**
   * Establece el token JWT y extrae los claims
   */
  setToken(token: string) {
    this._jwt.set(token);
    try {
      const base64 = token.split('.')[1];
      const json = globalThis.atob(base64);
      const claims = JSON.parse(json);
      this._claims.set(claims);

      // Detectar si es token de superadmin
      const isSuperAdmin =
        claims.isSuperAdmin === true || claims.role === 'SUPER_ADMIN';
      this._isSuperAdmin.set(isSuperAdmin);
    } catch {
      this._claims.set(null);
      this._isSuperAdmin.set(false);
    }

    // Guardar token en localStorage
    if (this._isSuperAdmin()) {
      globalThis.localStorage?.setItem(SUPERADMIN_TOKEN_KEY, token);
    } else if (this._tenantSlug) {
      globalThis.localStorage?.setItem(
        STORAGE_PREFIX + this._tenantSlug,
        token
      );
    }
  }

  /**
   * Limpia el token y los claims
   */
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

  /**
   * Verifica si el usuario actual es superadmin
   */
  get isSuperAdmin() {
    return this._isSuperAdmin();
  }

  isAuthenticated() {
    const c = this._claims();
    return !!c && c.exp * 1000 > Date.now();
  }

  hasRole(role: string) {
    return this._claims()?.role === role;
  }

  hasPermission(permission: string) {
    return this._claims()?.permissions?.includes(permission) ?? false;
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this._claims()?.permissions || [];

    // Wildcard permission
    if (userPermissions.includes('*')) {
      return true;
    }

    return permissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this._claims()?.permissions || [];

    // Wildcard permission
    if (userPermissions.includes('*')) {
      return true;
    }

    return permissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }

  /**
   * Obtiene todos los permisos del usuario actual
   */
  getPermissions(): string[] {
    return this._claims()?.permissions || [];
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getRole(): string | undefined {
    return this._claims()?.role;
  }

  /**
   * Login universal que detecta automáticamente el endpoint correcto
   * - Con tenant: usa /auth/login (con X-Tenant-Slug header automático)
   * - Sin tenant: usa /admin/auth/login (modo superadmin, sin X-Tenant-Slug)
   */
  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<void> {
    // Detectar si hay tenant activo
    const hasTenant = this._tenantSlug !== null;
    const endpoint = hasTenant ? '/auth/login' : '/admin/auth/login';

    console.log('🔐 [AuthService] Login ->', {
      hasTenant,
      endpoint,
      tenantSlug: this._tenantSlug,
    });

    try {
      // Si no hay tenant, inicializar modo superadmin
      if (!hasTenant) {
        this.initSuperAdmin();
      }

      // Llamar al endpoint correspondiente
      const response = await firstValueFrom(
        this.apiClient.post<AuthResponse>(endpoint, {
          email: credentials.email,
          password: credentials.password,
        })
      );

      if (!response?.token) {
        throw new Error('No se recibió token del servidor');
      }

      // Establecer el token recibido
      this.setToken(response.token);

      console.log('✅ [AuthService] Login exitoso', {
        isSuperAdmin: this._isSuperAdmin(),
        role: this.getRole(),
        tenantSlug: this._tenantSlug,
        expiresAt: response.expiresAt,
      });
    } catch (error) {
      console.error('❌ [AuthService] Error en login:', error);
      throw error;
    }
  }

  /**
   * Registro de usuario (solo para tenants, requiere X-Tenant-Slug)
   * POST /auth/register
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<void> {
    if (!this._tenantSlug) {
      throw new Error('El registro requiere un tenant activo');
    }

    console.log('📝 [AuthService] Registro ->', {
      endpoint: '/auth/register',
      tenantSlug: this._tenantSlug,
    });

    try {
      const response = await firstValueFrom(
        this.apiClient.post<AuthResponse>('/auth/register', data)
      );

      if (!response?.token) {
        throw new Error('No se recibió token del servidor');
      }

      // Establecer el token recibido
      this.setToken(response.token);

      console.log('✅ [AuthService] Registro exitoso', {
        email: data.email,
        tenantSlug: this._tenantSlug,
      });
    } catch (error) {
      console.error('❌ [AuthService] Error en registro:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   * - Con tenant: GET /auth/me (con X-Tenant-Slug)
   * - Sin tenant: GET /admin/auth/me (admin profile)
   */
  async getProfile(): Promise<UserProfile> {
    const hasTenant = this._tenantSlug !== null;
    const endpoint = hasTenant ? '/auth/me' : '/admin/auth/me';

    console.log('👤 [AuthService] Obtener perfil ->', {
      hasTenant,
      endpoint,
      tenantSlug: this._tenantSlug,
    });

    try {
      const profile = await firstValueFrom(
        this.apiClient.get<UserProfile>(endpoint)
      );

      console.log('✅ [AuthService] Perfil obtenido', {
        email: profile.email,
        isSuperAdmin: this._isSuperAdmin(),
      });

      return profile;
    } catch (error) {
      console.error('❌ [AuthService] Error obteniendo perfil:', error);
      throw error;
    }
  }
}
