import { Injectable, signal } from '@angular/core';
import { JwtPayload } from '../models/types';

const STORAGE_PREFIX = 'mtkn_';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _jwt = signal<string | null>(null);
  private readonly _claims = signal<JwtPayload | null>(null);
  private _tenantSlug: string | null = null;

  init(tenantSlug: string) {
    this._tenantSlug = tenantSlug;
    const token = globalThis.localStorage?.getItem(STORAGE_PREFIX + tenantSlug);
    if (token) this.setToken(token);
  }

  setToken(token: string) {
    this._jwt.set(token);
    try {
      const base64 = token.split('.')[1];
      const json = globalThis.atob(base64);
      this._claims.set(JSON.parse(json));
    } catch {
      this._claims.set(null);
    }
    if (this._tenantSlug) {
      globalThis.localStorage?.setItem(
        STORAGE_PREFIX + this._tenantSlug,
        token
      );
    }
  }

  clear() {
    this._jwt.set(null);
    this._claims.set(null);
    if (this._tenantSlug) {
      globalThis.localStorage?.removeItem(STORAGE_PREFIX + this._tenantSlug);
    }
  }

  get token() {
    return this._jwt();
  }
  get claims() {
    return this._claims();
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
}
