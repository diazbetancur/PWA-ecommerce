import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TenantBootstrapService } from '@pwa/core';
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
    <!-- Uso del Layout con branding automático -->
    <app-layout>
      <!-- El contenido de las rutas se renderiza aquí automáticamente -->
    </app-layout>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    /* Estilos globales que se pueden aplicar por tenant */
    :host-context(.tenant-demo-a) {
      /* Estilos específicos para demo-a */
    }

    :host-context(.tenant-demo-b) {
      /* Estilos específicos para demo-b */
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly tenantBootstrap = inject(TenantBootstrapService);

  async ngOnInit(): Promise<void> {
    try {
      // Inicializar el contexto del tenant
      await this.tenantBootstrap.initialize();
      console.log('✅ Tenant initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing tenant:', error);
      // Aquí podrías redirigir a una página de error o mostrar un mensaje
    }
  }
}
