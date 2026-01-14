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
  templateUrl: './banner-carousel.component.html',
  styleUrl: './banner-carousel.component.scss',
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
