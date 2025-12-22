import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
        <div class="skeleton-line skeleton-price"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .skeleton-card {
        background: var(--tenant-background-color, #ffffff);
        border: 1px solid var(--tenant-outline, rgba(0, 0, 0, 0.1));
        border-radius: 12px;
        overflow: hidden;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      .skeleton-image {
        aspect-ratio: 1;
        background: linear-gradient(
          90deg,
          #f0f0f0 25%,
          #e0e0e0 50%,
          #f0f0f0 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s infinite;
      }

      .skeleton-content {
        padding: 16px;
      }

      .skeleton-line {
        height: 16px;
        background: linear-gradient(
          90deg,
          #f0f0f0 25%,
          #e0e0e0 50%,
          #f0f0f0 75%
        );
        background-size: 200% 100%;
        border-radius: 4px;
        margin-bottom: 8px;
        animation: skeleton-shimmer 1.5s infinite;
      }

      .skeleton-title {
        width: 80%;
        height: 20px;
      }

      .skeleton-subtitle {
        width: 60%;
      }

      .skeleton-price {
        width: 40%;
        height: 18px;
        margin-bottom: 12px;
      }

      .skeleton-button {
        width: 100%;
        height: 40px;
        background: linear-gradient(
          90deg,
          #f0f0f0 25%,
          #e0e0e0 50%,
          #f0f0f0 75%
        );
        background-size: 200% 100%;
        border-radius: 8px;
        animation: skeleton-shimmer 1.5s infinite;
      }

      @keyframes skeleton-shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      @keyframes skeleton-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.8;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .skeleton-content {
          padding: 12px;
        }

        .skeleton-button {
          height: 36px;
        }
      }
    `,
  ],
})
export class ProductCardSkeletonComponent {}

@Component({
  selector: 'app-products-grid-skeleton',
  standalone: true,
  imports: [CommonModule, ProductCardSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="products-grid-skeleton">
      @for (item of skeletonItems; track $index) {
      <app-product-card-skeleton />
      }
    </div>
  `,
  styles: [
    `
      .products-grid-skeleton {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      @media (max-width: 768px) {
        .products-grid-skeleton {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
      }
    `,
  ],
})
export class ProductsGridSkeletonComponent {
  readonly skeletonItems = new Array(12).fill(0);
}
