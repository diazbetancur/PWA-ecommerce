import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClientService, AuthService as CoreAuthService } from '@pwa/core';
import { firstValueFrom } from 'rxjs';
import {
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

  async login(request: LoginRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      await this.coreAuth.login({
        email: request.email,
        password: request.password,
        rememberMe: request.rememberMe,
      });

      const profile = await this.coreAuth.getProfile();
      const claims = this.coreAuth.claims;

      this._state.update((s) => ({
        ...s,
        user: {
          ...profile,
          id: profile.userId, // Mapear userId a id
          role: claims?.roles?.[0] || '',
          permissions: claims?.modules || [],
        } as User,
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

  async register(request: RegisterRequest): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      if (request.password !== request.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (!request.acceptTerms) {
        throw new Error('Debes aceptar los términos y condiciones');
      }

      await this.coreAuth.register({
        email: request.email,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        phoneNumber: request.phoneNumber,
      });

      const profile = await this.coreAuth.getProfile();
      const claims = this.coreAuth.claims;

      this._state.update((s) => ({
        ...s,
        user: {
          ...profile,
          id: profile.userId, // Mapear userId a id
          role: claims?.roles?.[0] || '',
          permissions: claims?.modules || [],
        } as User,
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

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.apiClient.post<void>('/auth/logout', {})).catch(
        () => {}
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

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await firstValueFrom(
        this.apiClient.post<{ token: string; refreshToken: string }>(
          '/auth/refresh',
          { refreshToken }
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

  async initializeFromToken(): Promise<void> {
    if (this.coreAuth.isAuthenticated()) {
      try {
        await this.getProfile();
      } catch {
        this.coreAuth.clear();
      }
    }
  }

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
