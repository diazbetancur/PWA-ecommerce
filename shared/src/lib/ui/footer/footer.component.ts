import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <!-- Top Section -->
        <div class="footer-top">
          <!-- Brand -->
          <div class="footer-brand">
            <span class="brand-name">{{ displayName() }}</span>
            @if (description(); as desc) {
            <p class="brand-desc">{{ desc }}</p>
            }
          </div>

          <!-- Quick Links -->
          <nav class="footer-links">
            <a routerLink="/catalog">Productos</a>
            <a routerLink="/help">Ayuda</a>
            <a routerLink="/privacy">Privacidad</a>
            <a routerLink="/terms">Términos</a>
          </nav>

          <!-- Contact -->
          @if (contact(); as c) {
          <div class="footer-contact">
            @if (c.email) {
            <a [href]="'mailto:' + c.email" class="contact-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {{ c.email }}
            </a>
            } @if (c.phone) {
            <a [href]="'tel:' + c.phone" class="contact-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                />
              </svg>
              {{ c.phone }}
            </a>
            }
          </div>
          }
        </div>

        <!-- Bottom Section -->
        <div class="footer-bottom">
          <p class="copyright">
            © {{ currentYear }} {{ displayName() }}. Todos los derechos
            reservados.
          </p>

          <!-- Social Links -->
          @if (social(); as s) {
          <div class="social-links">
            @if (s.instagram) {
            <a
              [href]="s.instagram"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            } @if (s.facebook) {
            <a
              [href]="s.facebook"
              target="_blank"
              rel="noopener"
              aria-label="Facebook"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                />
              </svg>
            </a>
            } @if (s.twitter) {
            <a
              [href]="s.twitter"
              target="_blank"
              rel="noopener"
              aria-label="Twitter"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
                />
              </svg>
            </a>
            } @if (s.tikTok) {
            <a
              [href]="s.tikTok"
              target="_blank"
              rel="noopener"
              aria-label="TikTok"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                />
              </svg>
            </a>
            }
          </div>
          }
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background: var(--footer-bg, #1f2937);
        color: var(--footer-text, #9ca3af);
        margin-top: auto;
      }

      .footer-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }

      .footer-top {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      @media (min-width: 768px) {
        .footer-top {
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
        }
      }

      /* Brand */
      .footer-brand {
        max-width: 280px;
      }

      .brand-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #fff;
      }

      .brand-desc {
        margin: 0.5rem 0 0;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      /* Links */
      .footer-links {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 1.5rem;
      }

      .footer-links a {
        color: var(--footer-text, #9ca3af);
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s;
      }

      .footer-links a:hover {
        color: #fff;
      }

      /* Contact */
      .footer-contact {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--footer-text, #9ca3af);
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s;
      }

      .contact-item:hover {
        color: #fff;
      }

      .contact-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      /* Bottom */
      .footer-bottom {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 1.5rem;
        align-items: center;
        text-align: center;
      }

      @media (min-width: 768px) {
        .footer-bottom {
          flex-direction: row;
          justify-content: space-between;
          text-align: left;
        }
      }

      .copyright {
        font-size: 0.8125rem;
        margin: 0;
      }

      /* Social */
      .social-links {
        display: flex;
        gap: 0.75rem;
      }

      .social-links a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: var(--footer-text, #9ca3af);
        transition: all 0.2s;
      }

      .social-links a:hover {
        background: var(--primary-color, #3b82f6);
        color: #fff;
      }

      .social-links svg {
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class FooterComponent {
  private readonly tenantContext = inject(TenantContextService);

  currentYear = new Date().getFullYear();

  displayName = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.displayName || 'Tienda';
  });

  description = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.seo?.description || '';
  });

  contact = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.contact;
  });

  social = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.social;
  });
}
