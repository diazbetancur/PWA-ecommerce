import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_ENV, TenantConfigService } from '@pwa/core';

@Component({
  selector: 'lib-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="skip-link" href="#main" i18n="@@layout.skipToContent"
      >Skip to content</a
    >
    <header role="banner">
      <nav role="navigation" aria-label="Main navigation" class="navbar">
        <a class="brand" routerLink="/">
          {{ cfg.config?.tenant?.displayName || 'eCommerce' }}
        </a>
        <span class="tenant-pill" *ngIf="cfg.tenantSlug">{{
          cfg.tenantSlug
        }}</span>
      </nav>
      <!-- Dev-only tenant switcher (visible when mockApi in non-production) -->
      <div class="tenant-switch" *ngIf="!env.production && env.mockApi">
        <!-- Hot switch without reload in dev -->
        <button type="button" (click)="switch('demo-a')">demo-a</button>
        |
        <button type="button" (click)="switch('demo-b')">demo-b</button>
      </div>
    </header>
    <main id="main" role="main" tabindex="-1">
      <router-outlet />
    </main>
    <footer role="contentinfo" class="footer">
      <span i18n="@@footer.text">© 2025 My Shop</span>
    </footer>
  `,
  styles: [
    `
      .skip-link {
        position: absolute;
        left: -9999px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
      }
      .navbar {
        display: flex;
        gap: 1rem;
        padding: 0.5rem 1rem;
      }
      .brand {
        font-weight: 600;
      }
      .tenant-pill {
        margin-left: 0.5rem;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-size: 0.8rem;
        background: #eef;
      }
      .tenant-switch {
        padding: 0 0.75rem 0.5rem;
        font-size: 0.9rem;
        color: #666;
      }
      main {
        min-height: 60vh;
        padding: 1rem;
      }
      .footer {
        padding: 1rem;
        border-top: 1px solid #eee;
      }
    `,
  ],
})
export class PublicLayoutComponent {
  readonly cfg = inject(TenantConfigService);
  readonly env = inject(APP_ENV);
  async switch(slug: 'demo-a' | 'demo-b') {
    await this.cfg.switchTenant(slug);
  }
}
