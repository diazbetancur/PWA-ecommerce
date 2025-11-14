import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClientService, AuthService as CoreAuthService } from '@pwa/core';
import { firstValueFrom } from 'rxjs';
import {
  AuthResponse,
  AuthState,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiClient = inject(ApiClientService);
  private readonly coreAuth = inject(CoreAuthService);
  private readonly router = inject(Router);

  private readonly _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  readonly state = this._state.asReadonly();

  /**
   * Login del usuario
   */
  async login(request: LoginRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const response = await firstValueFrom(
        this.apiClient.post<AuthResponse>('/auth/login', {
          email: request.email,
          password: request.password,
        })
      );

      // Guardar token en el AuthService core
      this.coreAuth.setToken(response.token);

      // Guardar refreshToken si viene
      if (response.refreshToken && request.rememberMe) {
        this.saveRefreshToken(response.refreshToken);
      }

      this._state.update((s) => ({
        ...s,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al iniciar sesión';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(request: RegisterRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      if (request.password !== request.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (!request.acceptTerms) {
        throw new Error('Debes aceptar los términos y condiciones');
      }

      const response = await firstValueFrom(
        this.apiClient.post<AuthResponse>('/auth/register', {
          email: request.email,
          password: request.password,
          firstName: request.firstName,
          lastName: request.lastName,
          phoneNumber: request.phoneNumber,
        })
      );

      this.coreAuth.setToken(response.token);

      if (response.refreshToken) {
        this.saveRefreshToken(response.refreshToken);
      }

      this._state.update((s) => ({
        ...s,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al registrar usuario';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Logout del usuario
   */
  async logout(): Promise<void> {
    try {
      // Opcional: llamar al backend para invalidar token
      await firstValueFrom(this.apiClient.post<void>('/auth/logout', {})).catch(
        () => {
          // Ignorar errores del backend en logout
        }
      );
    } finally {
      this.coreAuth.clear();
      this.clearRefreshToken();
      this._state.set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      await this.router.navigate(['/']);
    }
  }

  /**
   * Recuperación de contraseña
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      await firstValueFrom(
        this.apiClient.post<{ message: string }>('/auth/forgot-password', {
          email: request.email,
        })
      );

      this._state.update((s) => ({ ...s, isLoading: false }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al solicitar recuperación';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Reset de contraseña con token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      if (request.password !== request.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      await firstValueFrom(
        this.apiClient.post<{ message: string }>('/auth/reset-password', {
          token: request.token,
          password: request.password,
        })
      );

      this._state.update((s) => ({ ...s, isLoading: false }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al restablecer contraseña';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Cambio de contraseña (usuario autenticado)
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      if (request.newPassword !== request.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      await firstValueFrom(
        this.apiClient.post<{ message: string }>('/auth/change-password', {
          currentPassword: request.currentPassword,
          newPassword: request.newPassword,
        })
      );

      this._state.update((s) => ({ ...s, isLoading: false }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al cambiar contraseña';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const user = await firstValueFrom(
        this.apiClient.get<User>('/auth/profile')
      );

      this._state.update((s) => ({
        ...s,
        user,
        isAuthenticated: true,
        isLoading: false,
      }));

      return user;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al obtener perfil';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const user = await firstValueFrom(
        this.apiClient.put<User>('/auth/profile', request)
      );

      this._state.update((s) => ({
        ...s,
        user,
        isLoading: false,
      }));

      return user;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar perfil';
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }

  /**
   * Refrescar token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await firstValueFrom(
        this.apiClient.post<{ token: string; refreshToken: string }>(
          '/auth/refresh',
          {
            refreshToken,
          }
        )
      );

      this.coreAuth.setToken(response.token);
      this.saveRefreshToken(response.refreshToken);

      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  /**
   * Inicializar estado desde token existente
   */
  async initializeFromToken(): Promise<void> {
    if (this.coreAuth.isAuthenticated()) {
      try {
        await this.getProfile();
      } catch {
        // Token inválido, limpiar
        this.coreAuth.clear();
      }
    }
  }

  // Métodos privados para refresh token
  private saveRefreshToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }

  private getRefreshToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private clearRefreshToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('refresh_token');
    }
  }
}
