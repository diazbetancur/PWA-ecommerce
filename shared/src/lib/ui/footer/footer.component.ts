import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="app-footer">
      <div class="footer-container">
        <!-- Main Footer Content -->
        <div class="footer-main">
          <!-- Brand Section -->
          <div class="footer-brand">
            <h3 class="brand-name">{{ displayName() }}</h3>
            <p class="brand-description">
              {{ description() }}
            </p>

            @if (contactInfo(); as contact) {
              <div class="contact-info">
                @if (contact.email) {
                  <a [href]="'mailto:' + contact.email" class="contact-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {{ contact.email }}
                  </a>
                }

                @if (contact.phone) {
                  <a [href]="'tel:' + contact.phone" class="contact-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                    {{ contact.phone }}
                  </a>
                }
              </div>
            }
          </div>

          <!-- Links Sections -->
          <div class="footer-links">
            <div class="link-section">
              <h4 class="section-title">Productos</h4>
              <ul class="link-list">
                <li><a routerLink="/catalog">Catálogo</a></li>
                <li><a routerLink="/catalog?category=featured">Destacados</a></li>
                <li><a routerLink="/catalog?category=offers">Ofertas</a></li>
              </ul>
            </div>

            <div class="link-section">
              <h4 class="section-title">Empresa</h4>
              <ul class="link-list">
                <li><a routerLink="/about">Acerca de</a></li>
                <li><a routerLink="/contact">Contacto</a></li>
                <li><a routerLink="/careers">Trabajos</a></li>
              </ul>
            </div>

            <div class="link-section">
              <h4 class="section-title">Soporte</h4>
              <ul class="link-list">
                <li><a routerLink="/help">Ayuda</a></li>
                <li><a routerLink="/shipping">Envíos</a></li>
                <li><a routerLink="/returns">Devoluciones</a></li>
              </ul>
            </div>

            <div class="link-section">
              <h4 class="section-title">Legal</h4>
              <ul class="link-list">
                <li><a routerLink="/privacy">Privacidad</a></li>
                <li><a routerLink="/terms">Términos</a></li>
                <li><a routerLink="/cookies">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="copyright">
            <p>&copy; {{ currentYear }} {{ displayName() }}. Todos los derechos reservados.</p>
            @if (tenantSlug()) {
              <p class="tenant-info">Tenant: <code>{{ tenantSlug() }}</code></p>
            }
          </div>

          @if (socialLinks(); as social) {
            <div class="social-links">
              @if (social.facebook) {
                <a [href]="social.facebook" target="_blank" rel="noopener" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              }

              @if (social.twitter) {
                <a [href]="social.twitter" target="_blank" rel="noopener" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              }

              @if (social.instagram) {
                <a [href]="social.instagram" target="_blank" rel="noopener" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zm6.624 18.611c-.862.862-2.012 1.337-3.237 1.337h-6.774c-1.225 0-2.375-.475-3.237-1.337C4.531 17.749 4.056 16.599 4.056 15.374V8.6c0-1.225.475-2.375 1.337-3.237C6.255 4.501 7.405 4.026 8.63 4.026h6.774c1.225 0 2.375.475 3.237 1.337.862.862 1.337 2.012 1.337 3.237v6.774c0 1.225-.475 2.375-1.337 3.237z"/>
                  </svg>
                </a>
              }
            </div>
          }
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: var(--tenant-secondary-color, #1f2937);
      color: var(--tenant-footer-text, #f9fafb);
      margin-top: auto;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 1rem 1rem;
    }

    .footer-main {
      display: grid;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    @media (min-width: 768px) {
      .footer-main {
        grid-template-columns: 1fr 2fr;
        gap: 4rem;
      }
    }

    /* Brand Section */
    .footer-brand {
      max-width: 350px;
    }

    .brand-name {
      color: var(--tenant-primary-color, #60a5fa);
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .brand-description {
      color: var(--tenant-footer-text-muted, #d1d5db);
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--tenant-footer-text-muted, #d1d5db);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }

    .contact-link:hover {
      color: var(--tenant-primary-color, #60a5fa);
    }

    .contact-link svg {
      flex-shrink: 0;
    }

    /* Footer Links */
    .footer-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 2rem;
    }

    .link-section {
      display: flex;
      flex-direction: column;
    }

    .section-title {
      color: var(--tenant-footer-text, #f9fafb);
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .link-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .link-list a {
      color: var(--tenant-footer-text-muted, #d1d5db);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s ease;
      line-height: 1.5;
    }

    .link-list a:hover {
      color: var(--tenant-primary-color, #60a5fa);
    }

    /* Footer Bottom */
    .footer-bottom {
      border-top: 1px solid var(--tenant-footer-border, #374151);
      padding-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
      color: var(--tenant-footer-text-muted, #d1d5db);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .copyright p {
      margin: 0;
    }

    .tenant-info {
      font-size: 0.75rem !important;
      opacity: 0.7;
      margin-top: 0.25rem !important;
    }

    .tenant-info code {
      background: var(--tenant-footer-code-bg, #374151);
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      color: var(--tenant-primary-color, #60a5fa);
    }

    /* Social Links */
    .social-links {
      display: flex;
      gap: 1rem;
    }

    .social-links a {
      color: var(--tenant-footer-text-muted, #d1d5db);
      transition: color 0.2s ease;
      padding: 0.5rem;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .social-links a:hover {
      color: var(--tenant-primary-color, #60a5fa);
      background: var(--tenant-footer-social-hover, #374151);
    }

    /* CSS Variables Fallbacks */
    :host {
      --tenant-footer-text: #f9fafb;
      --tenant-footer-text-muted: #d1d5db;
      --tenant-footer-border: #374151;
      --tenant-footer-code-bg: #374151;
      --tenant-footer-social-hover: #374151;
    }
  `]
})
export class FooterComponent {
  private readonly tenantContext = inject(TenantContextService);

  // Reactive tenant data
  displayName = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.displayName || 'PWA Store';
  });

  tenantSlug = computed(() => this.tenantContext.getTenantSlug());

  description = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.description || 'Tu tienda online de confianza con los mejores productos y servicio al cliente.';
  });

  contactInfo = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.contact;
  });

  socialLinks = computed(() => {
    const tenant = this.tenantContext.getCurrentTenant();
    return tenant?.socialLinks;
  });

  // Current year for copyright
  currentYear = new Date().getFullYear();
}
