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
  templateUrl: './banner-carousel.component.html',
  styleUrl: './banner-carousel.component.scss',
})
export class BannerCarouselComponent {
  // TODO: Obtener banners del backend
  banners = signal<Banner[]>([]);

  constructor() {
    // TODO: Llamar al servicio de banners cuando esté disponible
    // this.loadBanners();
  }
}
