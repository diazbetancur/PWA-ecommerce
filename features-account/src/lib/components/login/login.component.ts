import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import {
  AuthService,
  ModeSelectorDialogComponent,
  TenantConfigService,
  TenantContextService,
  UserModeService,
} from '@pwa/core';
import { AccountService } from '../../services';
import { shouldShowControlError } from '../../utils/password-form.utils';

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
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly userModeService = inject(UserModeService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  // Usar tenant por defecto si no hay tenant disponible
  readonly tenantConfigData = computed(() =>
    this.tenantContext.getTenantConfigOrDefault()
  );
  readonly tenantName = computed(
    () => this.tenantConfigData().tenant.displayName
  );

  // Verificar si hay tenant activo (necesario para mostrar opción de registro)
  // Usar TenantConfigService que es el que se inicializa en APP_INITIALIZER
  readonly hasTenant = computed(() => !!this.tenantConfig.tenantSlug);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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
    this.submitted.set(true);

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

    // 1️⃣ Si es SuperAdmin/Admin CON tenant en el token → Admin del Tenant
    if (isSuperAdmin && hasTenantInToken) {
      await this.router.navigate(['/tenant-admin']);
      return;
    }

    // 2️⃣ Si es SuperAdmin/Admin SIN tenant en el token → Admin General
    if (isSuperAdmin && !hasTenantInToken) {
      await this.router.navigate(['/admin']);
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
        await this.router.navigate(['/']);
      } else if (selectedMode === 'employee') {
        await this.router.navigate(['/tenant-admin']);
      }
    }
    // 4️⃣ Si solo es Customer, ir al catálogo
    else if (this.userModeService.isCustomerOnly()) {
      await this.router.navigate(['/']);
    }
    // 5️⃣ Si solo tiene roles de empleado (sin Customer), ir directo a admin del tenant
    else if (this.userModeService.hasEmployeeRoles()) {
      await this.router.navigate(['/tenant-admin']);
    }
    // Fallback: ir al home
    else {
      await this.router.navigate(['/']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  getFieldError(field: 'email' | 'password'): string | null {
    const control = this.loginForm.get(field);
    if (!shouldShowControlError(control, this.submitted())) {
      return null;
    }

    if (!control) {
      return null;
    }

    if (control.hasError('required')) {
      return `${field === 'email' ? 'Email' : 'Contraseña'} es requerido.`;
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo válido.';
    }

    return null;
  }
}
