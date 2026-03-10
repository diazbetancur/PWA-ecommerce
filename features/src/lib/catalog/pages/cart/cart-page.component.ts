import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PublicCartUiService, TenantCurrencyPipe } from '@pwa/core';

type DeliveryMode = 'pickup' | 'delivery';
type PaymentMode = 'gateway-card' | 'gateway-pse';

@Component({
  selector: 'lib-cart-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TenantCurrencyPipe],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {
  private readonly cartUi = inject(PublicCartUiService);
  private readonly router = inject(Router);

  readonly cartLines = this.cartUi.lines;
  readonly totalItems = this.cartUi.totalItems;
  readonly subtotal = this.cartUi.totalAmount;

  readonly couponCode = signal('');
  readonly couponApplied = signal(false);
  readonly couponMessage = signal('');
  readonly deliveryMode = signal<DeliveryMode>('pickup');
  readonly paymentMode = signal<PaymentMode>('gateway-card');

  readonly shippingCost = computed(() =>
    this.deliveryMode() === 'delivery' ? 8000 : 0
  );

  readonly grandTotal = computed(() => this.subtotal() + this.shippingCost());

  increment(productId: string): void {
    this.cartUi.incrementItem(productId);
  }

  decrement(productId: string): void {
    this.cartUi.decrementItem(productId);
  }

  remove(productId: string): void {
    this.cartUi.removeItem(productId);
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.couponApplied.set(false);
      this.couponMessage.set('Ingresa un cupón para validarlo.');
      return;
    }

    this.couponApplied.set(true);
    this.couponMessage.set(`Cupón ${code} aplicado (simulación).`);
  }

  payNow(): void {
    if (this.totalItems() === 0) {
      return;
    }

    this.couponApplied.set(false);
    this.couponMessage.set('Pago simulado correctamente.');
    this.cartUi.clearCart();
  }

  continueShopping(): void {
    this.router.navigate(['/catalog']);
  }
}
