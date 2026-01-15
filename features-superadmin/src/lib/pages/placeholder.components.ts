/**
 * Placeholder component - Estos componentes se crearán según las necesidades específicas
 */
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

const createPlaceholder = (title: string) => {
  @Component({
    standalone: true,
    imports: [CommonModule],
    template: `
      <div class="placeholder-page">
        <h1>{{ title }}</h1>
        <p>Esta página está en desarrollo.</p>
      </div>
    `,
    styles: [
      `
        .placeholder-page {
          padding: 2rem;
        }
        h1 {
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        p {
          color: #64748b;
        }
      `,
    ],
  })
  class PlaceholderComponent {
    title = title;
  }
  return PlaceholderComponent;
};

export const TenantListComponent = createPlaceholder('Lista de Comercios');
export const TenantCreateComponent = createPlaceholder('Crear Comercio');
export const TenantDetailComponent = createPlaceholder('Detalle del Comercio');
export const TenantEditComponent = createPlaceholder('Editar Comercio');
export const TenantConfigComponent = createPlaceholder(
  'Configuración de Comercios'
);
export const UserListComponent = createPlaceholder('Lista de Usuarios');
export const UserRolesComponent = createPlaceholder('Roles y Permisos');
export const SubscriptionListComponent = createPlaceholder('Subscripciones');
export const BillingOverviewComponent = createPlaceholder('Facturación');
export const AnalyticsDashboardComponent = createPlaceholder('Analytics');
export const SystemConfigComponent = createPlaceholder('Configuración Global');
export const FeatureFlagsComponent = createPlaceholder('Feature Flags');
export const SystemLogsComponent = createPlaceholder('Logs del Sistema');
export const AdminProfileComponent = createPlaceholder('Mi Perfil');
export const AdminSettingsComponent = createPlaceholder('Configuración');
