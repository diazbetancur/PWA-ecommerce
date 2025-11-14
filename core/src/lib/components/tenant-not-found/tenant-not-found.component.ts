import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Componente que se muestra cuando no se encuentra un tenant
 */
@Component({
  selector: 'app-tenant-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tenant-not-found">
      <div class="error-container">
        <div class="error-icon">🏢</div>
        <h1>Tenant No Encontrado</h1>
        <p>No se pudo cargar la configuración para este dominio o tenant.</p>
        <p class="help-text">
          Por favor, verifica la URL o contacta al administrador del sistema.
        </p>
        <a routerLink="/" class="btn-home">Volver al Inicio</a>
      </div>
    </div>
  `,
  styles: [
    `
      .tenant-not-found {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .error-container {
        background: white;
        border-radius: 1rem;
        padding: 3rem 2rem;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .error-icon {
        font-size: 5rem;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 2rem;
        color: #1a202c;
        margin: 0 0 1rem;
      }

      p {
        color: #4a5568;
        margin: 0 0 1rem;
        line-height: 1.6;
      }

      .help-text {
        font-size: 0.875rem;
        color: #718096;
      }

      .btn-home {
        display: inline-block;
        margin-top: 1.5rem;
        padding: 0.75rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: 600;
        transition: transform 0.2s;
      }

      .btn-home:hover {
        transform: translateY(-2px);
      }
    `,
  ],
})
export class TenantNotFoundComponent {}
