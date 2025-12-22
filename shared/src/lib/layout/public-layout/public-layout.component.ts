import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FooterComponent,
  HeaderComponent,
  WhatsappButtonComponent,
} from '../../ui';

@Component({
  selector: 'lib-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    WhatsappButtonComponent,
  ],
  template: `
    <a class="skip-link" href="#main">Ir al contenido</a>
    <app-header />
    <main id="main" role="main" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-whatsapp-button />
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .skip-link {
        position: absolute;
        left: -9999px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        z-index: 9999;
        background: var(--primary-color, #3b82f6);
        color: #fff;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
      }

      .skip-link:focus {
        position: fixed;
        left: 1rem;
        top: 1rem;
        width: auto;
        height: auto;
      }

      main {
        flex: 1;
      }
    `,
  ],
})
export class PublicLayoutComponent {}
