import { CartItem, Order, Product } from '../../models/types';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductsApi {
  list(params?: {
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Product[]>;
  byId(id: string): Promise<Product | undefined>;
}

export interface CategoriesApi {
  list(): Promise<Category[]>;
}

export interface CartApi {
  get(): Promise<{ items: CartItem[]; total: number }>;
  add(productId: string, qty: number): Promise<void>;
  remove(productId: string): Promise<void>;
}

export interface OrdersApi {
  list(): Promise<Order[]>;
  create(payload: {
    items: CartItem[];
    total: number;
  }): Promise<{ id: string }>;
}

export interface CouponsApi {
  validate(code: string): Promise<{ valid: boolean; amount?: number }>;
}

export interface MediaApi {
  upload(file: File): Promise<{ url: string }>;
}

export interface AuthApi {
  login(email: string, password: string): Promise<{ token: string }>;
  refresh(refreshToken: string): Promise<{ token: string }>;
}

export interface ConfigApi {
  getPublicConfig(): Promise<unknown>;
}

export interface AdminApi {
  products: ProductsApi;
  orders: OrdersApi;
  users: {
    list(): Promise<{ id: string; email: string; role: string }[]>;
    assignRole(userId: string, role: string): Promise<void>;
  };
}

export interface SuperadminApi {
  tenants: {
    list(): Promise<
      { id: string; slug: string; plan: string; active: boolean }[]
    >;
    create(payload: { slug: string; plan: string }): Promise<{ id: string }>;
    pause(id: string): Promise<void>;
  };
  plans: {
    list(): Promise<
      { id: string; name: string; features: Record<string, boolean> }[]
    >;
    toggleFlag(tenantId: string, flag: string, value: boolean): Promise<void>;
  };
  metrics: {
    byTenant(
      id: string
    ): Promise<{ visits: number; sales: number; conversion: number }>;
  };
}
