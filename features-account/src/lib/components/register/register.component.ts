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
  selector: 'lib-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly tenantContext = inject(TenantContextService);
  private readonly userModeService = inject(UserModeService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Usar tenant por defecto si no hay tenant disponible
  readonly tenantConfig = computed(() =>
    this.tenantContext.getTenantConfigOrDefault()
  );
  readonly tenantName = computed(() => this.tenantConfig().tenant.displayName);

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  readonly isLoading = signal(false);

  constructor() {
    // Sincronizar con estado del servicio
    effect(() => {
      this.isLoading.set(this.accountService.state().isLoading);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    try {
      const values = this.registerForm.getRawValue();
      await this.accountService.register(values);

      // Determinar redirección basada en roles del usuario
      await this.navigateAfterRegister();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al registrar usuario'
      );
    }
  }

  /**
   * Navega a la ruta apropiada después del registro según los roles del usuario
   */
  private async navigateAfterRegister(): Promise<void> {
    // Inicializar el servicio de modo
    this.userModeService.init();

    // Verificar si hay tenant activo en el contexto
    const tenantSlug = this.tenantContext.tenantSlug();
    const hasTenant = !!tenantSlug;
    console.log('[RegisterComponent] Tenant slug:', tenantSlug);
    console.log('[RegisterComponent] Has active tenant:', hasTenant);

    // Obtener roles del token
    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    console.log('[RegisterComponent] User roles from token:', roles);

    // Normalizar roles para comparación
    const normalizedRoles = roles.map((r) =>
      r.toLowerCase().replaceAll('_', '')
    );
    const isSuperAdmin = normalizedRoles.includes('superadmin');

    // 1️⃣ Si es SuperAdmin SIN tenant activo → Admin General
    if (isSuperAdmin && !hasTenant) {
      console.log(
        '[RegisterComponent] → Path: SuperAdmin without tenant - navigating to /admin'
      );
      await this.router.navigate(['/admin']);
      return;
    }

    // 2️⃣ Si es SuperAdmin CON tenant activo → Admin del Tenant
    if (isSuperAdmin && hasTenant) {
      console.log(
        '[RegisterComponent] → Path: SuperAdmin with tenant - navigating to /tenant-admin'
      );
      await this.router.navigate(['/tenant-admin']);
      return;
    }

    // Si tiene múltiples roles, mostrar selector de modo
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
    // Si solo es Customer, ir al catálogo
    else if (this.userModeService.isCustomerOnly()) {
      await this.router.navigate(['/']);
    }
    // Si solo tiene roles de empleado (sin Customer), ir directo a admin
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

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  getFieldError(
    field:
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'password'
      | 'confirmPassword'
      | 'acceptTerms'
  ): string | null {
    const control = this.registerForm.get(field);
    if (!control?.touched) return null;

    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Email',
        password: 'Contraseña',
        confirmPassword: 'Confirmar contraseña',
        acceptTerms: 'Debes aceptar los términos',
      };
      return `${labels[field]} es requerido`;
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (control.hasError('requiredTrue')) {
      return 'Debes aceptar los términos y condiciones';
    }
    return null;
  }

  passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return password === confirmPassword;
  }
}
