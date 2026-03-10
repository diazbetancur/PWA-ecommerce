import { HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface PublicCartLine {
  id?: string;
  productId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

interface CartDto {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  totalItems: number;
}

interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class PublicCartUiService {
  private readonly apiClient = inject(ApiClientService);

  private readonly SESSION_KEY = 'public_cart_session_id';
  private readonly linesState = signal<Record<string, PublicCartLine>>({});
  private readonly lastAddedProductIdState = signal<string | null>(null);
  private readonly summaryVisibleState = signal<boolean>(false);
  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.syncCart();
  }

  readonly lines = computed(() => Object.values(this.linesState()));
  readonly totalItems = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0)
  );
  readonly totalAmount = computed(() =>
    this.lines().reduce(
      (total, line) => total + line.quantity * line.unitPrice,
      0
    )
  );

  readonly lastAddedLine = computed(() => {
    const lastAddedId = this.lastAddedProductIdState();
    if (!lastAddedId) {
      return null;
    }

    return this.linesState()[lastAddedId] ?? null;
  });

  readonly summaryVisible = computed(() => this.summaryVisibleState());

  addItem(
    item: Omit<PublicCartLine, 'quantity'> & { quantity?: number }
  ): void {
    const quantityToAdd = Math.max(1, item.quantity ?? 1);

    const request: AddToCartRequest = {
      productId: item.productId,
      quantity: quantityToAdd,
    };

    this.apiClient
      .post<CartDto, AddToCartRequest>('/api/cart/items', request, {
        headers: this.buildSessionHeaders(),
      })
      .subscribe({
        next: (cart) => {
          this.applyCart(cart, {
            productId: item.productId,
            imageUrl: item.imageUrl,
            name: item.name,
            unitPrice: item.unitPrice,
          });
          this.lastAddedProductIdState.set(item.productId);
          this.summaryVisibleState.set(true);
          this.scheduleAutoHide();
        },
        error: () => {
          // Si falla backend, mantener UX mínima local para no romper flujo de compra
          this.linesState.update((current) => {
            const existing = current[item.productId];
            const nextLine: PublicCartLine = {
              id: existing?.id,
              productId: item.productId,
              name: item.name,
              imageUrl: item.imageUrl,
              unitPrice: item.unitPrice,
              quantity: (existing?.quantity ?? 0) + quantityToAdd,
            };

            return {
              ...current,
              [item.productId]: nextLine,
            };
          });
          this.lastAddedProductIdState.set(item.productId);
          this.summaryVisibleState.set(true);
          this.scheduleAutoHide();
        },
      });
  }

  incrementItem(productId: string): void {
    const line = this.linesState()[productId];
    if (!line) {
      return;
    }

    this.setItemQuantity(productId, line.quantity + 1);
  }

  decrementItem(productId: string): void {
    const line = this.linesState()[productId];
    if (!line) {
      return;
    }

    if (line.quantity <= 1) {
      this.removeItem(productId);
      return;
    }

    this.setItemQuantity(productId, line.quantity - 1);
  }

  setItemQuantity(productId: string, quantity: number): void {
    const line = this.linesState()[productId];
    if (!line || quantity < 1) {
      return;
    }

    if (!line.id) {
      this.linesState.update((current) => ({
        ...current,
        [productId]: {
          ...line,
          quantity,
        },
      }));
      return;
    }

    this.apiClient
      .put<CartDto, UpdateCartItemRequest>(
        `/api/cart/items/${line.id}`,
        { quantity },
        { headers: this.buildSessionHeaders() }
      )
      .subscribe({
        next: (cart) => {
          this.applyCart(cart);
        },
        error: () => {
          // no-op
        },
      });
  }

  removeItem(productId: string): void {
    const line = this.linesState()[productId];
    if (!line) {
      return;
    }

    if (!line.id) {
      this.linesState.update((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      return;
    }

    this.apiClient
      .delete<void>(`/api/cart/items/${line.id}`, {
        headers: this.buildSessionHeaders(),
      })
      .subscribe({
        next: () => {
          this.syncCart();
        },
        error: () => {
          // no-op
        },
      });
  }

  clearCart(): void {
    this.apiClient
      .delete<void>('/api/cart', {
        headers: this.buildSessionHeaders(),
      })
      .subscribe({
        next: () => {
          this.linesState.set({});
          this.lastAddedProductIdState.set(null);
          this.hideSummary();
        },
        error: () => {
          // no-op
        },
      });
  }

  hideSummary(): void {
    this.clearAutoHideTimer();
    this.summaryVisibleState.set(false);
  }

  syncCart(): void {
    this.apiClient
      .get<CartDto>('/api/cart', {
        headers: this.buildSessionHeaders(),
      })
      .subscribe({
        next: (cart) => {
          this.applyCart(cart);
        },
        error: () => {
          // No-op: carrito vacío o no disponible en este momento
        },
      });
  }

  private applyCart(
    cart: CartDto,
    lastAddedContext?: {
      productId: string;
      imageUrl: string;
      name: string;
      unitPrice: number;
    }
  ): void {
    this.linesState.update((current) => {
      const next: Record<string, PublicCartLine> = {};

      for (const item of cart.items) {
        const previous = current[item.productId];
        const imageUrl =
          item.productId === lastAddedContext?.productId
            ? lastAddedContext.imageUrl
            : previous?.imageUrl ?? '/assets/images/product-placeholder.webp';

        next[item.productId] = {
          id: item.id,
          productId: item.productId,
          name: item.productName,
          imageUrl,
          unitPrice: item.price,
          quantity: item.quantity,
        };
      }

      return next;
    });
  }

  private getOrCreateSessionId(): string {
    const existing = globalThis.localStorage?.getItem(this.SESSION_KEY);
    if (existing && existing.trim().length > 0) {
      return existing;
    }

    const generated =
      globalThis.crypto?.randomUUID?.() ??
      `web-session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    globalThis.localStorage?.setItem(this.SESSION_KEY, generated);
    return generated;
  }

  private buildSessionHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Session-Id': this.getOrCreateSessionId(),
    });
  }

  private scheduleAutoHide(): void {
    this.clearAutoHideTimer();

    this.autoHideTimer = setTimeout(() => {
      this.summaryVisibleState.set(false);
      this.autoHideTimer = null;
    }, 4000);
  }

  private clearAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
}
