import { Injectable } from '@angular/core';
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

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Camiseta básica',
    price: 49900,
    images: ['/icons/icon-192x192.png'],
    active: true,
  },
  {
    id: 'p2',
    name: 'Pantalón jeans',
    price: 129900,
    images: ['/icons/icon-192x192.png'],
    active: true,
  },
];

let mockCart: CartItem[] = [];

@Injectable({ providedIn: 'root' })
export class MockApiAdapter {
  products: ProductsApi = {
    list: async () => delay(MOCK_PRODUCTS),
    byId: async (id: string) => delay(MOCK_PRODUCTS.find((p) => p.id === id)),
  };

  categories: CategoriesApi = {
    list: async () => delay([{ id: 'c1', name: 'Ropa', slug: 'ropa' }]),
  };

  cart: CartApi = {
    get: async () =>
      delay({
        items: mockCart,
        total: mockCart.reduce((s, i) => s + i.price * i.qty, 0),
      }),
    add: async (productId: string, qty: number) => {
      const p = MOCK_PRODUCTS.find((x) => x.id === productId);
      if (p) {
        const existing = mockCart.find((i) => i.productId === productId);
        if (existing) existing.qty += qty;
        else mockCart.push({ productId, qty, price: p.price });
      }
      await delay(null);
    },
    remove: async (productId: string) => {
      mockCart = mockCart.filter((i) => i.productId !== productId);
      await delay(null);
    },
  };

  orders: OrdersApi = {
    list: async () => delay<Order[]>([]),
    create: async (payload: { items: CartItem[]; total: number }) => {
      if (payload) {
        // no-op to satisfy linter
      }
      return delay({ id: 'ord_' + Date.now() });
    },
  };

  coupons: CouponsApi = {
    validate: async (code: string) =>
      delay({ valid: code.toUpperCase() === 'DESCUENTO10', amount: 10 }),
  };

  media: MediaApi = {
    upload: async (_file: File) => {
      if (_file) {
        /* noop */
      }
      return delay({ url: '/uploaded/mock.png' });
    },
  };

  auth: AuthApi = {
    login: async (_email: string, _password: string) => {
      if (_email && _password) {
        /* noop */
      }
      return delay({ token: 'mock.jwt.token' });
    },
    refresh: async (_refreshToken: string) => {
      if (_refreshToken) {
        /* noop */
      }
      return delay({ token: 'mock.jwt.token' });
    },
  };

  admin: AdminApi = {
    products: this.products,
    orders: this.orders,
    users: {
      list: async () =>
        delay([{ id: 'u1', email: 'admin@demo.com', role: 'admin' }]),
      assignRole: async (_userId: string, _role: string) => {
        if (_userId && _role) {
          /* noop */
        }
        return delay(undefined);
      },
    },
  };

  superadmin: SuperadminApi = {
    tenants: {
      list: async () =>
        delay([{ id: 't1', slug: 'demo_a', plan: 'pro', active: true }]),
      create: async (_payload: { slug: string; plan: string }) => {
        if (_payload) {
          /* noop */
        }
        return delay({ id: 't' + Date.now() });
      },
      pause: async (_id: string) => {
        if (_id) {
          /* noop */
        }
        return delay(undefined);
      },
    },
    plans: {
      list: async () =>
        delay([{ id: 'free', name: 'Free', features: { reviews: false } }]),
      toggleFlag: async (_tenantId: string, _flag: string, _value: boolean) => {
        if (_tenantId || _flag || _value) {
          /* noop */
        }
        return delay(undefined);
      },
    },
    metrics: {
      byTenant: async (_id: string) => {
        if (_id) {
          /* noop */
        }
        return delay({ visits: 1000, sales: 123, conversion: 2.3 });
      },
    },
  };
}
