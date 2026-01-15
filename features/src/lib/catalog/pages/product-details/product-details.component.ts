import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { TenantContextService } from '@pwa/core';
import { Product } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);

  // Input para el ID del producto (desde la ruta)
  readonly productId = input.required<string>();

  // Signals
  readonly product = signal<Product | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly productImageUrl = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    return this.catalogService.buildImageUrl(prod.imageUrl);
  });

  readonly formattedPrice = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    return this.catalogService.formatPrice(prod.price);
  });

  readonly isInStock = computed(() => {
    const prod = this.product();
    const stock = prod?.stock ?? 0;
    return this.catalogService.isInStock(stock);
  });

  ngOnInit() {
    this.loadProduct();
  }

  private loadProduct() {
    const id = this.productId();

    if (!id) {
      this.error.set('ID de producto no válido');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.catalogService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product.set(response.data);
        } else {
          this.error.set(response.message || 'Producto no encontrado');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error cargando el producto: ' + err.message);
        this.isLoading.set(false);
      },
    });
  }

  // Event handlers
  addToCart() {
    const prod = this.product();
    if (prod) {
      console.log('Agregar al carrito:', prod);
      // Placeholder: integrar con CartService
      alert(`${prod.name} agregado al carrito`);
    }
  }

  retry() {
    this.loadProduct();
  }

  goBack() {
    this.router.navigate(['/catalog']);
  }
}
