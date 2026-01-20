import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import {
  AuthService,
  ModeSelectorDialogComponent,
  TenantContextService,
  UserModeService,
} from '@pwa/core';
import { AccountService } from '../../services';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly tenantContext = inject(TenantContextService);
  private readonly userModeService = inject(UserModeService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Usar tenant por defecto si no hay tenant disponible
  readonly tenantConfig = computed(() =>
    this.tenantContext.getTenantConfigOrDefault()
  );
  readonly tenantName = computed(() => this.tenantConfig().tenant.displayName);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['admin@yourdomain.com', [Validators.required, Validators.email]],
    password: ['Admin123!', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  readonly isLoading = signal(false);

  constructor() {
    // Sincronizar con estado del servicio
    effect(() => {
      this.isLoading.set(this.accountService.state().isLoading);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    try {
      const values = this.loginForm.getRawValue();
      await this.accountService.login(values);

      // Determinar redirección basada en roles del usuario
      await this.navigateAfterLogin();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al iniciar sesión'
      );
    }
  }

  /**
   * Navega a la ruta apropiada después del login según los roles del usuario
   */
  private async navigateAfterLogin(): Promise<void> {
    // Inicializar el servicio de modo
    this.userModeService.init();

    // Obtener claims del token
    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    const isAdminFlag = claims?.admin === 'true' || claims?.admin === true;

    // ⚠️ IMPORTANTE: El tenant se verifica desde el TOKEN, no desde el contexto de la URL
    const tenantSlugFromToken = claims?.tenant_slug || null;
    const hasTenantInToken = !!tenantSlugFromToken;

    // Normalizar roles para comparación
    const normalizedRoles = roles.map((r) =>
      r.toLowerCase().replaceAll('_', '')
    );
    const isSuperAdmin = normalizedRoles.includes('superadmin') || isAdminFlag;

    // 🔑 CRITICAL: Preservar query params (especialmente ?tenant=xxx)
    const navExtras = { queryParamsHandling: 'preserve' as const };

    // 1️⃣ Si es SuperAdmin/Admin CON tenant en el token → Admin del Tenant
    if (isSuperAdmin && hasTenantInToken) {
      await this.router.navigate(['/tenant-admin'], navExtras);
      return;
    }

    // 2️⃣ Si es SuperAdmin/Admin SIN tenant en el token → Admin General
    if (isSuperAdmin && !hasTenantInToken) {
      await this.router.navigate(['/admin'], navExtras);
      return;
    }

    // 🔍 DEBUG: Si llegamos aquí, no es superadmin

    // 3️⃣ Si tiene múltiples roles, mostrar selector de modo
    if (this.userModeService.hasMultipleRoles()) {
      const dialogRef = this.dialog.open(ModeSelectorDialogComponent, {
        disableClose: true,
        width: '600px',
        maxWidth: '90vw',
      });

      const { firstValueFrom } = await import('rxjs');
      const selectedMode = await firstValueFrom(dialogRef.afterClosed());

      if (selectedMode === 'customer') {
        await this.router.navigate(['/'], navExtras);
      } else if (selectedMode === 'employee') {
        await this.router.navigate(['/tenant-admin'], navExtras);
      }
    }
    // 4️⃣ Si solo es Customer, ir al catálogo
    else if (this.userModeService.isCustomerOnly()) {
      await this.router.navigate(['/'], navExtras);
    }
    // 5️⃣ Si solo tiene roles de empleado (sin Customer), ir directo a admin del tenant
    else if (this.userModeService.hasEmployeeRoles()) {
      await this.router.navigate(['/tenant-admin'], navExtras);
    }
    // Fallback: ir al home
    else {
      await this.router.navigate(['/'], navExtras);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  getFieldError(field: 'email' | 'password'): string | null {
    const control = this.loginForm.get(field);
    if (!control?.touched) return null;

    if (control.hasError('required')) {
      return `${field === 'email' ? 'Email' : 'Contraseña'} es requerido`;
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  }
}
