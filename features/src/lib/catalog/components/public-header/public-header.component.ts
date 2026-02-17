import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthService, TenantConfigService } from '@pwa/core';
import { TenantAuthModalService } from '@pwa/features-account';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'lib-public-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly tenantAuthModal = inject(TenantAuthModalService);

  // Search control
  searchControl = new FormControl('');

  // Tenant info
  tenantLogo = computed(() => this.tenantConfig.config?.theme?.logoUrl);
  tenantName = computed(
    () => this.tenantConfig.config?.tenant?.displayName || 'Tienda'
  );

  // Auth state
  isLoggedIn = computed(() => this.authService.isAuthenticated());
  userName = computed(() => {
    const claims = this.authService.claims;
    return claims?.email || 'Perfil';
  });

  // Cart badge (TODO: integrar con servicio de carrito)
  cartItemCount = signal(0);

  constructor() {
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (value && value.length >= 4) {
          this.search(value);
        } else if (!value) {
          // Clear search
          this.search('');
        }
      });
  }

  search(query: string): void {
    this.router.navigate(['/'], {
      queryParams: { q: query || null },
      queryParamsHandling: 'merge',
    });
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const value = this.searchControl.value || '';
      this.search(value);
    }
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToLogin(): void {
    this.tenantAuthModal.open('login');
  }

  goToProfile(): void {
    this.router.navigate(['/account']);
  }

  logout(): void {
    // TODO: Implementar logout correcto
    this.router.navigate(['/']);
  }
}
