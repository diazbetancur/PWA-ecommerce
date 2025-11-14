/**
 * Placeholder component - Estos componentes se crearán según las necesidades específicas
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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

export const TenantListComponent = createPlaceholder('Lista de Tenants');
export const TenantCreateComponent = createPlaceholder('Crear Tenant');
export const TenantDetailComponent = createPlaceholder('Detalle del Tenant');
export const TenantEditComponent = createPlaceholder('Editar Tenant');
export const TenantConfigComponent = createPlaceholder(
  'Configuración de Tenants'
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
