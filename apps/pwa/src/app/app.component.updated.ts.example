import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TenantBootstrapService, TenantContextService } from '@pwa/core';
import { LayoutComponent } from '@pwa/shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LayoutComponent
  ],
  template: `
    <!--
      Conditional Layout:
      - Si estamos en /tenant/not-found, mostrar solo RouterOutlet
      - Si no, usar el LayoutComponent normal
    -->
    @if (shouldShowLayout()) {
      <app-layout></app-layout>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // El APP_INITIALIZER ya maneja la inicialización y redirección
    // Aquí solo agregamos logging adicional si es necesario

    // Opcional: Suscribirse a cambios de estado del tenant
    this.tenantBootstrap.tenantStatus.subscribe(status => {
      console.log('🔄 Tenant status changed:', status);

      if (status === 'error') {
        console.log('🔥 Tenant error detected, should redirect to /tenant/not-found');
      }
    });

    // Opcional: Suscribirse a cambios de tenant para logging
    this.tenantContext.tenantConfig$.subscribe(config => {
      if (config) {
        console.log('🎯 Tenant loaded:', config.tenant.displayName);
        this.updatePageTitle(config.tenant.displayName);
      }
    });
  }

  /**
   * Determina si debe mostrar el layout principal
   * No mostrar layout en páginas de error o debug de tenant
   */
  shouldShowLayout(): boolean {
    const currentUrl = this.router.url;

    // No mostrar layout en páginas especiales de tenant
    if (currentUrl.includes('/tenant/not-found') ||
        currentUrl.includes('/tenant/error') ||
        currentUrl.includes('/tenant/debug')) {
      return false;
    }

    // Verificar si el tenant está en estado de error (pero no para debug)
    if (this.tenantBootstrap.hasError() && !currentUrl.includes('/tenant/debug')) {
      return false;
    }

    return true;
  }

  /**
   * Actualiza el título de la página con el nombre del tenant
   */
  private updatePageTitle(tenantName: string): void {
    document.title = `${tenantName} - PWA Store`;
  }
}
