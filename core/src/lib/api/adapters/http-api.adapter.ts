import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_ENV, AppEnv } from '../../config/app-env.token';
import { CartItem, Order, Product } from '../../models/types';
import {
  AdminApi,
  AuthApi,
  CartApi,
  CategoriesApi,
  CouponsApi,
  MediaApi,
  OrdersApi,
  ProductsApi,
  SuperadminApi,
} from '../contracts';

@Injectable({ providedIn: 'root' })
export class HttpApiAdapter {
  private readonly http = inject(HttpClient);
  private readonly env: AppEnv = inject(APP_ENV);
  private get base() {
    return this.env.apiBaseUrl;
  }

  products: ProductsApi = {
    list: (params?: { q?: string; page?: number; pageSize?: number }) =>
      firstValueFrom(
        this.http.get<Product[]>(`${this.base}/products`, {
          params: params as any,
        })
      ),
    byId: (id: string) =>
      firstValueFrom(this.http.get<Product>(`${this.base}/products/${id}`)),
  };

  categories: CategoriesApi = {
    list: () =>
      firstValueFrom(
        this.http.get<{ id: string; name: string; slug: string }[]>(
          `${this.base}/categories`
        )
      ),
  };

  cart: CartApi = {
    get: () =>
      firstValueFrom(
        this.http.get<{ items: CartItem[]; total: number }>(`${this.base}/cart`)
      ),
    add: (productId: string, qty: number) =>
      firstValueFrom(
        this.http.post<void>(`${this.base}/cart`, { productId, qty })
      ),
    remove: (productId: string) =>
      firstValueFrom(this.http.delete<void>(`${this.base}/cart/${productId}`)),
  };

  orders: OrdersApi = {
    list: () => firstValueFrom(this.http.get<Order[]>(`${this.base}/orders`)),
    create: (payload: { items: CartItem[]; total: number }) =>
      firstValueFrom(
        this.http.post<{ id: string }>(`${this.base}/orders`, payload)
      ),
  };

  coupons: CouponsApi = {
    validate: (code: string) =>
      firstValueFrom(
        this.http.post<{ valid: boolean; amount?: number }>(
          `${this.base}/coupons/validate`,
          { code }
        )
      ),
  };

  media: MediaApi = {
    upload: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return firstValueFrom(
        this.http.post<{ url: string }>(`${this.base}/media`, form)
      );
    },
  };

  auth: AuthApi = {
    login: (email: string, password: string) =>
      firstValueFrom(
        this.http.post<{ token: string }>(`${this.base}/auth/login`, {
          email,
          password,
        })
      ),
    refresh: (refreshToken: string) =>
      firstValueFrom(
        this.http.post<{ token: string }>(`${this.base}/auth/refresh`, {
          refreshToken,
        })
      ),
  };

  admin: AdminApi = {
    products: this.products,
    orders: this.orders,
    users: {
      list: () =>
        firstValueFrom(
          this.http.get<{ id: string; email: string; role: string }[]>(
            `${this.base}/admin/users`
          )
        ),
      assignRole: (userId: string, role: string) =>
        firstValueFrom(
          this.http.post<void>(`${this.base}/admin/users/${userId}/role`, {
            role,
          })
        ),
    },
  };

  superadmin: SuperadminApi = {
    tenants: {
      list: () =>
        firstValueFrom(
          this.http.get<
            { id: string; slug: string; plan: string; active: boolean }[]
          >(`${this.base}/super/tenants`)
        ),
      create: (payload: { slug: string; plan: string }) =>
        firstValueFrom(
          this.http.post<{ id: string }>(`${this.base}/super/tenants`, payload)
        ),
      pause: (id: string) =>
        firstValueFrom(
          this.http.post<void>(`${this.base}/super/tenants/${id}/pause`, {})
        ),
    },
    plans: {
      list: () =>
        firstValueFrom(
          this.http.get<
            { id: string; name: string; features: Record<string, boolean> }[]
          >(`${this.base}/super/plans`)
        ),
      toggleFlag: (tenantId: string, flag: string, value: boolean) =>
        firstValueFrom(
          this.http.post<void>(`${this.base}/super/tenants/${tenantId}/flags`, {
            flag,
            value,
          })
        ),
    },
    metrics: {
      byTenant: (id: string) =>
        firstValueFrom(
          this.http.get<{ visits: number; sales: number; conversion: number }>(
            `${this.base}/super/metrics/${id}`
          )
        ),
    },
  };
}
