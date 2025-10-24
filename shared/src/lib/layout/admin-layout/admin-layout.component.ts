import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { TenantConfigService } from '@pwa/core';

@Component({
  selector: 'lib-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav
        mode="side"
        opened
        role="navigation"
        aria-label="Admin sidenav"
      >
        <mat-nav-list>
          <a mat-list-item routerLink="/admin" i18n="@@admin.title"
            >Administración</a
          >
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" role="banner">
          <span i18n="@@admin.breadcrumb">Admin</span>
        </mat-toolbar>
        <main id="main" role="main" tabindex="-1">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .container {
        height: 100vh;
      }
      main {
        padding: 1rem;
      }
    `,
  ],
})
export class AdminLayoutComponent {
  readonly cfg = inject(TenantConfigService);
  readonly pushEnabled = computed(() => !!this.cfg.config?.features?.['push']);
}
