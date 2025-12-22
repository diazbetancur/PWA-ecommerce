import { CommonModule } from '@angular/common';
import { Component, effect, input, OnDestroy, signal } from '@angular/core';

export interface Banner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string;
  imageUrlDesktop?: string;
  imageUrlMobile?: string | null;
  mobileImageUrl?: string | null;
  link?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  linkTarget?: '_self' | '_blank';
  position?: 'hero' | 'sidebar' | 'footer';
}

@Component({
  selector: 'app-banner-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (banners().length > 0) {
    <div class="carousel" [class.single]="banners().length === 1">
      <div
        class="carousel-track"
        [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'"
      >
        @for (banner of banners(); track banner.id) {
        <div class="carousel-slide">
          @if (getBannerLink(banner)) {
          <a
            [href]="getBannerLink(banner)"
            [target]="banner.linkTarget || '_self'"
            class="banner-link"
          >
            <picture>
              @if (getBannerMobileImage(banner)) {
              <source
                media="(max-width: 640px)"
                [srcset]="getBannerMobileImage(banner)"
              />
              }
              <img
                [src]="getBannerDesktopImage(banner)"
                [alt]="banner.title || 'Banner'"
                class="banner-image"
              />
            </picture>
            @if (banner.title || banner.subtitle) {
            <div class="banner-content">
              @if (banner.title) {
              <h2 class="banner-title">{{ banner.title }}</h2>
              } @if (banner.subtitle) {
              <p class="banner-subtitle">{{ banner.subtitle }}</p>
              } @if (banner.buttonText) {
              <span class="banner-button">{{ banner.buttonText }}</span>
              }
            </div>
            }
          </a>
          } @else {
          <div class="banner-wrapper">
            <picture>
              @if (getBannerMobileImage(banner)) {
              <source
                media="(max-width: 640px)"
                [srcset]="getBannerMobileImage(banner)"
              />
              }
              <img
                [src]="getBannerDesktopImage(banner)"
                [alt]="banner.title || 'Banner'"
                class="banner-image"
              />
            </picture>
            @if (banner.title || banner.subtitle) {
            <div class="banner-content">
              @if (banner.title) {
              <h2 class="banner-title">{{ banner.title }}</h2>
              } @if (banner.subtitle) {
              <p class="banner-subtitle">{{ banner.subtitle }}</p>
              }
            </div>
            }
          </div>
          }
        </div>
        }
      </div>

      <!-- Indicators -->
      @if (banners().length > 1) {
      <div class="carousel-indicators">
        @for (banner of banners(); track banner.id; let i = $index) {
        <button
          type="button"
          class="indicator"
          [class.active]="currentIndex() === i"
          (click)="goTo(i)"
          [attr.aria-label]="'Ir a banner ' + (i + 1)"
        ></button>
        }
      </div>

      <!-- Navigation Arrows -->
      <button
        type="button"
        class="nav-arrow prev"
        (click)="prev()"
        aria-label="Anterior"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        class="nav-arrow next"
        (click)="next()"
        aria-label="Siguiente"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      }
    </div>
    }
  `,
  styles: [
    `
      .carousel {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: 0.75rem;
        background: var(--hover-bg, #f3f4f6);
      }

      .carousel.single .carousel-track {
        animation: none;
      }

      .carousel-track {
        display: flex;
        transition: transform 0.5s ease-out;
      }

      .carousel-slide {
        flex: 0 0 100%;
        min-width: 100%;
      }

      .banner-link,
      .banner-wrapper {
        display: block;
        position: relative;
        width: 100%;
        text-decoration: none;
        color: inherit;
      }

      .banner-image {
        width: 100%;
        height: auto;
        aspect-ratio: 21/9;
        object-fit: cover;
        display: block;
      }

      @media (max-width: 640px) {
        .banner-image {
          aspect-ratio: 16/9;
        }
      }

      .banner-content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 2rem;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: #fff;
      }

      @media (max-width: 640px) {
        .banner-content {
          padding: 1rem;
        }
      }

      .banner-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 640px) {
        .banner-title {
          font-size: 1.25rem;
        }
      }

      .banner-subtitle {
        font-size: 1rem;
        margin: 0;
        opacity: 0.9;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 640px) {
        .banner-subtitle {
          font-size: 0.875rem;
        }
      }

      .banner-button {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.625rem 1.5rem;
        background: var(--primary-color, #3b82f6);
        color: #fff;
        border-radius: 0.5rem;
        font-size: 0.9375rem;
        font-weight: 500;
        text-shadow: none;
        transition: background 0.2s;
      }

      .banner-link:hover .banner-button {
        background: var(--primary-hover, #2563eb);
      }

      @media (max-width: 640px) {
        .banner-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
      }

      /* Indicators */
      .carousel-indicators {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
        z-index: 10;
      }

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 0;
        transition: all 0.2s;
      }

      .indicator.active {
        background: #fff;
        transform: scale(1.25);
      }

      .indicator:hover:not(.active) {
        background: rgba(255, 255, 255, 0.75);
      }

      /* Navigation Arrows */
      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        color: #374151;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        opacity: 0;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .carousel:hover .nav-arrow {
        opacity: 1;
      }

      .nav-arrow:hover {
        background: #fff;
        transform: translateY(-50%) scale(1.1);
      }

      .nav-arrow svg {
        width: 20px;
        height: 20px;
      }

      .nav-arrow.prev {
        left: 1rem;
      }

      .nav-arrow.next {
        right: 1rem;
      }

      @media (max-width: 640px) {
        .nav-arrow {
          width: 32px;
          height: 32px;
          opacity: 1;
        }

        .nav-arrow svg {
          width: 16px;
          height: 16px;
        }

        .nav-arrow.prev {
          left: 0.5rem;
        }

        .nav-arrow.next {
          right: 0.5rem;
        }
      }
    `,
  ],
})
export class BannerCarouselComponent implements OnDestroy {
  banners = input<Banner[]>([]);
  autoPlayInterval = input<number>(5000);

  currentIndex = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const interval = this.autoPlayInterval();
      const bannersCount = this.banners().length;

      this.stopAutoPlay();

      if (bannersCount > 1 && interval > 0) {
        this.startAutoPlay(interval);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  private startAutoPlay(interval: number): void {
    this.intervalId = setInterval(() => {
      this.next();
    }, interval);
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  next(): void {
    const total = this.banners().length;
    if (total > 1) {
      this.currentIndex.update((i) => (i + 1) % total);
    }
  }

  prev(): void {
    const total = this.banners().length;
    if (total > 1) {
      this.currentIndex.update((i) => (i - 1 + total) % total);
    }
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.stopAutoPlay();
    if (this.autoPlayInterval() > 0) {
      this.startAutoPlay(this.autoPlayInterval());
    }
  }

  getBannerDesktopImage(banner: Banner): string {
    return banner.imageUrlDesktop || banner.imageUrl || '';
  }

  getBannerMobileImage(banner: Banner): string | null {
    return banner.imageUrlMobile || banner.mobileImageUrl || null;
  }

  getBannerLink(banner: Banner): string | null {
    return banner.targetUrl || banner.link || null;
  }
}
