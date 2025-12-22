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
    console.log('[LoginComponent] navigateAfterLogin - START');

    // Inicializar el servicio de modo
    this.userModeService.init();

    // Obtener claims del token
    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    const isAdminFlag = claims?.admin === 'true' || claims?.admin === true;

    // ⚠️ IMPORTANTE: El tenant se verifica desde el TOKEN, no desde el contexto de la URL
    const tenantSlugFromToken = claims?.tenant_slug || null;
    const hasTenantInToken = !!tenantSlugFromToken;

    console.log('[LoginComponent] User roles from token:', roles);
    console.log('[LoginComponent] Admin flag:', isAdminFlag);
    console.log(
      '[LoginComponent] Tenant slug from TOKEN:',
      tenantSlugFromToken
    );
    console.log('[LoginComponent] Has tenant in TOKEN:', hasTenantInToken);

    // Normalizar roles para comparación
    const normalizedRoles = roles.map((r) =>
      r.toLowerCase().replaceAll('_', '')
    );
    const isSuperAdmin = normalizedRoles.includes('superadmin') || isAdminFlag;

    console.log('[LoginComponent] Is SuperAdmin:', isSuperAdmin);

    // 1️⃣ Si es SuperAdmin/Admin CON tenant en el token → Admin del Tenant
    if (isSuperAdmin && hasTenantInToken) {
      console.log(
        '[LoginComponent] → Path: Admin with tenant - navigating to /tenant-admin'
      );
      await this.router.navigate(['/tenant-admin']);
      console.log('[LoginComponent] navigateAfterLogin - END');
      return;
    }

    // 2️⃣ Si es SuperAdmin/Admin SIN tenant en el token → Admin General
    if (isSuperAdmin && !hasTenantInToken) {
      console.log(
        '[LoginComponent] → Path: Admin without tenant - navigating to /admin'
      );
      await this.router.navigate(['/admin']);
      console.log('[LoginComponent] navigateAfterLogin - END');
      return;
    }

    console.log(
      '[LoginComponent] hasMultipleRoles:',
      this.userModeService.hasMultipleRoles()
    );
    console.log(
      '[LoginComponent] isCustomerOnly:',
      this.userModeService.isCustomerOnly()
    );
    console.log(
      '[LoginComponent] hasEmployeeRoles:',
      this.userModeService.hasEmployeeRoles()
    );
    console.log(
      '[LoginComponent] hasCustomerRole:',
      this.userModeService.hasCustomerRole()
    );

    // 3️⃣ Si tiene múltiples roles, mostrar selector de modo
    if (this.userModeService.hasMultipleRoles()) {
      console.log('[LoginComponent] → Path: Multiple roles - showing dialog');
      const dialogRef = this.dialog.open(ModeSelectorDialogComponent, {
        disableClose: true,
        width: '600px',
        maxWidth: '90vw',
      });

      const { firstValueFrom } = await import('rxjs');
      const selectedMode = await firstValueFrom(dialogRef.afterClosed());

      if (selectedMode === 'customer') {
        console.log('[LoginComponent] → Navigating to: /');
        await this.router.navigate(['/']);
      } else if (selectedMode === 'employee') {
        console.log('[LoginComponent] → Navigating to: /tenant-admin');
        await this.router.navigate(['/tenant-admin']);
      }
    }
    // 4️⃣ Si solo es Customer, ir al catálogo
    else if (this.userModeService.isCustomerOnly()) {
      console.log('[LoginComponent] → Path: Customer only - navigating to /');
      await this.router.navigate(['/']);
      await this.router.navigate(['/']);
    }
    // Si solo tiene roles de empleado (sin Customer), ir directo a admin
    else if (this.userModeService.hasEmployeeRoles()) {
      console.log(
        '[LoginComponent] → Path: Employee roles - navigating to /tenant-admin'
      );
      await this.router.navigate(['/tenant-admin']);
    }
    // Fallback: ir al home
    else {
      console.log('[LoginComponent] → Path: Fallback - navigating to /');
      await this.router.navigate(['/']);
    }

    console.log('[LoginComponent] navigateAfterLogin - END');
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
