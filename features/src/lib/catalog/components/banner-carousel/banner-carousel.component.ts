import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

/**
 * Interfaz para banners (placeholder - implementar con backend)
 */
export interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  title?: string;
  order: number;
}

@Component({
  selector: 'lib-banner-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- TODO: Implementar servicio de banners y carrusel funcional -->
    @if (banners().length > 0) {
    <section class="banner-carousel">
      <div class="banner-container">
        @for (banner of banners(); track banner.id) {
        <div class="banner-slide">
          @if (banner.link) {
          <a [href]="banner.link" class="banner-link">
            <img
              [src]="banner.imageUrl"
              [alt]="banner.title || 'Banner'"
              class="banner-image"
            />
          </a>
          } @else {
          <img
            [src]="banner.imageUrl"
            [alt]="banner.title || 'Banner'"
            class="banner-image"
          />
          }
        </div>
        }
      </div>
    </section>
    }
  `,
  styles: [
    `
      .banner-carousel {
        width: 100%;
        margin-bottom: 2rem;
        overflow: hidden;
      }

      .banner-container {
        position: relative;
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
      }

      .banner-slide {
        width: 100%;
      }

      .banner-link {
        display: block;
        line-height: 0;
      }

      .banner-image {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: cover;
        border-radius: 8px;

        @media (max-width: 768px) {
          max-height: 200px;
          border-radius: 0;
        }
      }
    `,
  ],
})
export class BannerCarouselComponent {
  // TODO: Obtener banners del backend
  banners = signal<Banner[]>([]);

  constructor() {
    // TODO: Llamar al servicio de banners cuando esté disponible
    // this.loadBanners();
  }
}
