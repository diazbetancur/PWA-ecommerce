import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../services/api-client.service';
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

/**
 * Adapter HTTP que implementa todas las APIs usando ApiClientService
 * - Usa paths relativos automáticamente
 * - Se beneficia del sistema de entornos y logging
 * - Integrado con TenantHeaderInterceptor
 */
@Injectable({ providedIn: 'root' })
export class HttpApiAdapter {
  private readonly apiClient = inject(ApiClientService);

  products: ProductsApi = {
    list: (params?: { q?: string; page?: number; pageSize?: number }) =>
      firstValueFrom(
        this.apiClient.getWithParams<Product[]>('/products', params || {})
      ),
    byId: (id: string) =>
      firstValueFrom(this.apiClient.get<Product>(`/products/${id}`)),
  };

  categories: CategoriesApi = {
    list: () =>
      firstValueFrom(
        this.apiClient.get<{ id: string; name: string; slug: string }[]>('/categories')
      ),
  };

  cart: CartApi = {
    get: () =>
      firstValueFrom(
        this.apiClient.get<{ items: CartItem[]; total: number }>('/cart')
      ),
    add: (productId: string, qty: number) =>
      firstValueFrom(
        this.apiClient.post<void>('/cart', { productId, qty })
      ),
    remove: (productId: string) =>
      firstValueFrom(this.apiClient.delete<void>(`/cart/${productId}`)),
  };

  orders: OrdersApi = {
    list: () => firstValueFrom(this.apiClient.get<Order[]>('/orders')),
    create: (payload: { items: CartItem[]; total: number }) =>
      firstValueFrom(
        this.apiClient.post<{ id: string }>('/orders', payload)
      ),
  };

  coupons: CouponsApi = {
    validate: (code: string) =>
      firstValueFrom(
        this.apiClient.post<{ valid: boolean; amount?: number }>(
          '/coupons/validate',
          { code }
        )
      ),
  };

  media: MediaApi = {
    upload: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return firstValueFrom(
        this.apiClient.post<{ url: string }>('/media', form)
      );
    },
  };

  auth: AuthApi = {
    login: (email: string, password: string) =>
      firstValueFrom(
        this.apiClient.post<{ token: string }>('/auth/login', {
          email,
          password,
        })
      ),
    refresh: (refreshToken: string) =>
      firstValueFrom(
        this.apiClient.post<{ token: string }>('/auth/refresh', {
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
          this.apiClient.get<{ id: string; email: string; role: string }[]>(
            '/admin/users'
          )
        ),
      assignRole: (userId: string, role: string) =>
        firstValueFrom(
          this.apiClient.post<void>(`/admin/users/${userId}/role`, {
            role,
          })
        ),
    },
  };

  superadmin: SuperadminApi = {
    tenants: {
      list: () =>
        firstValueFrom(
          this.apiClient.get<
            { id: string; slug: string; plan: string; active: boolean }[]
          >('/super/tenants')
        ),
      create: (payload: { slug: string; plan: string }) =>
        firstValueFrom(
          this.apiClient.post<{ id: string }>('/super/tenants', payload)
        ),
      pause: (id: string) =>
        firstValueFrom(
          this.apiClient.post<void>(`/super/tenants/${id}/pause`, {})
        ),
    },
    plans: {
      list: () =>
        firstValueFrom(
          this.apiClient.get<
            { id: string; name: string; features: Record<string, boolean> }[]
          >('/super/plans')
        ),
      toggleFlag: (tenantId: string, flag: string, value: boolean) =>
        firstValueFrom(
          this.apiClient.post<void>(`/super/tenants/${tenantId}/flags`, {
            flag,
            value,
          })
        ),
    },
    metrics: {
      byTenant: (id: string) =>
        firstValueFrom(
          this.apiClient.get<{ visits: number; sales: number; conversion: number }>(
            `/super/metrics/${id}`
          )
        ),
    },
  };
}
