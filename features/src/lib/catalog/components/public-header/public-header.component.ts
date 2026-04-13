import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  PublicCartUiService,
  TenantConfigService,
  TenantCurrencyPipe,
} from '@pwa/core';
import { AccountService, TenantAuthModalService } from '@pwa/features-account';
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
    TenantCurrencyPipe,
  ],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly tenantAuthModal = inject(TenantAuthModalService);
  private readonly publicCartUi = inject(PublicCartUiService);

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

  // Cart summary state
  readonly cartItemCount = this.publicCartUi.totalItems;
  readonly cartTotal = this.publicCartUi.totalAmount;
  readonly lastAddedItem = this.publicCartUi.lastAddedLine;
  readonly showCartSummary = this.publicCartUi.summaryVisible;

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
    this.publicCartUi.hideSummary();
    this.router.navigate(['/cart']);
  }

  closeCartSummary(event?: Event): void {
    event?.stopPropagation();
    this.publicCartUi.hideSummary();
  }

  goToLogin(): void {
    this.tenantAuthModal.open('login');
  }

  goToProfile(): void {
    this.router.navigate(['/account']);
  }

  async logout(): Promise<void> {
    await this.accountService.logout();
  }
}
