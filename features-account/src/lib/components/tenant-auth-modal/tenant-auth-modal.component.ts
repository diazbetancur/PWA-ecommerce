import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AuthService,
  ModeSelectorDialogComponent,
  TenantConfigService,
  TenantContextService,
  UserModeService,
} from '@pwa/core';
import { AccountService } from '../../services';

@Component({
  selector: 'lib-tenant-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './tenant-auth-modal.component.html',
  styleUrl: './tenant-auth-modal.component.scss',
})
export class TenantAuthModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly userModeService = inject(UserModeService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<TenantAuthModalComponent>);

  readonly activeTab = signal<'login' | 'register'>('login');
  readonly showForgotPassword = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  readonly tenantConfigData = computed(() =>
    this.tenantContext.getTenantConfigOrDefault()
  );
  readonly tenantName = computed(
    () => this.tenantConfigData().tenant.displayName
  );
  readonly hasTenant = computed(() => !!this.tenantConfig.tenantSlug);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => {
      this.isLoading.set(this.accountService.state().isLoading);
    });
  }

  selectTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
    this.showForgotPassword.set(false);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  close(): void {
    this.dialogRef.close();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  toggleForgotPassword(): void {
    this.showForgotPassword.update((value) => !value);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const values = this.loginForm.getRawValue();
      await this.accountService.login(values);
      this.dialogRef.close(true);
      await this.navigateAfterAuth();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al iniciar sesión'
      );
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.hasTenant()) {
      this.errorMessage.set('No hay un comercio activo para registrarse');
      return;
    }

    if (!this.passwordsMatch()) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const values = this.registerForm.getRawValue();
      await this.accountService.register(values);
      this.dialogRef.close(true);
      await this.navigateAfterAuth();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al crear cuenta'
      );
    }
  }

  async submitForgotPassword(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const { email } = this.forgotForm.getRawValue();
      await this.accountService.forgotPassword({ email });
      this.successMessage.set(
        'Se envió un enlace de recuperación a tu correo electrónico.'
      );
      this.forgotForm.reset();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Error al solicitar recuperación de cuenta'
      );
    }
  }

  passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return password === confirmPassword;
  }

  getLoginFieldError(field: 'email' | 'password'): string | null {
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

  getRegisterFieldError(
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

  getForgotFieldError(): string | null {
    const control = this.forgotForm.get('email');
    if (!control?.touched) return null;

    if (control.hasError('required')) {
      return 'Email es requerido';
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }

    return null;
  }

  private async navigateAfterAuth(): Promise<void> {
    this.userModeService.init();

    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    const isAdminFlag = claims?.admin === 'true' || claims?.admin === true;

    const tenantSlugFromToken = claims?.tenant_slug || null;
    const hasTenantInToken = !!tenantSlugFromToken;

    const normalizedRoles = roles.map((role) =>
      role.toLowerCase().replaceAll('_', '')
    );
    const isSuperAdmin = normalizedRoles.includes('superadmin') || isAdminFlag;

    const navExtras = { queryParamsHandling: 'preserve' as const };

    if (isSuperAdmin && hasTenantInToken) {
      await this.router.navigate(['/tenant-admin'], navExtras);
      return;
    }

    if (isSuperAdmin && !hasTenantInToken) {
      await this.router.navigate(['/admin'], navExtras);
      return;
    }

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
        return;
      }

      if (selectedMode === 'employee') {
        await this.router.navigate(['/tenant-admin'], navExtras);
        return;
      }
    }

    if (this.userModeService.isCustomerOnly()) {
      await this.router.navigate(['/'], navExtras);
      return;
    }

    if (this.userModeService.hasEmployeeRoles()) {
      await this.router.navigate(['/tenant-admin'], navExtras);
      return;
    }

    await this.router.navigate(['/'], navExtras);
  }
}
