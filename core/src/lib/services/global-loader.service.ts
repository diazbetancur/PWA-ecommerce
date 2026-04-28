import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalLoaderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly showDelayMs = 280;
  private readonly minVisibleMs = 400;

  private readonly activeRequests = signal(0);
  private readonly visible = signal(false);

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private lastShownAt = 0;

  readonly isVisible = this.visible.asReadonly();
  readonly activeRequestCount = this.activeRequests.asReadonly();

  show(): void {
    this.beginRequest();
  }

  hide(): void {
    this.endRequest();
  }

  beginRequest(): void {
    this.activeRequests.update((count) => count + 1);

    if (this.activeRequests() === 1) {
      this.scheduleShow();
    }
  }

  endRequest(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));

    if (this.activeRequests() === 0) {
      this.scheduleHide();
    }
  }

  reset(): void {
    this.clearShowTimer();
    this.clearHideTimer();
    this.activeRequests.set(0);
    this.visible.set(false);
    this.lastShownAt = 0;
  }

  private scheduleShow(): void {
    this.clearHideTimer();

    if (!this.isBrowser || this.visible() || this.showTimer) {
      return;
    }

    this.showTimer = setTimeout(() => {
      this.showTimer = null;

      if (this.activeRequests() > 0) {
        this.lastShownAt = Date.now();
        this.visible.set(true);
      }
    }, this.showDelayMs);
  }

  private scheduleHide(): void {
    this.clearShowTimer();

    if (!this.isBrowser || !this.visible()) {
      this.visible.set(false);
      this.lastShownAt = 0;
      return;
    }

    this.clearHideTimer();

    const elapsed = Date.now() - this.lastShownAt;
    const remaining = Math.max(this.minVisibleMs - elapsed, 0);

    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;

      if (this.activeRequests() === 0) {
        this.visible.set(false);
        this.lastShownAt = 0;
      }
    }, remaining);
  }

  private clearShowTimer(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
