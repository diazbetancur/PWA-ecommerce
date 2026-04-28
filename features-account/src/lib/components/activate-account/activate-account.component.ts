import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TenantContextService } from '@pwa/core';
import { map } from 'rxjs';
import { AccountService } from '../../services';
import {
  AUTH_PASSWORD_MAX_LENGTH,
  getPasswordErrorMessage,
  passwordMatchValidator,
  shouldShowControlError,
  strongPasswordValidator,
} from '../../utils/password-form.utils';

@Component({
  selector: 'lib-activate-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css',
})
export class ActivateAccountComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly tenantContext = inject(TenantContextService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly submitted = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly passwordMaxLength = AUTH_PASSWORD_MAX_LENGTH;

  readonly tenantConfigData = computed(() =>
    this.tenantContext.getTenantConfigOrDefault()
  );
  readonly tenantName = computed(
    () => this.tenantConfigData().tenant.displayName
  );
  readonly hasToken = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => !!params.get('token')?.trim())
    ),
    {
      initialValue: !!this.route.snapshot.queryParamMap.get('token')?.trim(),
    }
  );

  readonly activateForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator('password', 'confirmPassword')],
    }
  );

  constructor() {
    effect(() => {
      this.isLoading.set(this.accountService.state().isLoading);
    });
  }

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set(null);

    const token = this.getTokenFromQueryParam();
    if (!token) {
      this.errorMessage.set(
        'El enlace de activación no es válido o está incompleto. Solicita uno nuevo desde recuperación de contraseña.'
      );
      return;
    }

    if (this.activateForm.invalid) {
      this.activateForm.markAllAsTouched();
      return;
    }

    try {
      const { password, confirmPassword } = this.activateForm.getRawValue();
      await this.accountService.activateAccount({
        token,
        password,
        confirmPassword,
      });
      await this.router.navigate(['/account/login']);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'No pudimos completar la activación. Intenta nuevamente más tarde.'
      );
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  getFieldError(field: 'password' | 'confirmPassword'): string | null {
    const control = this.activateForm.get(field);
    const showError = shouldShowControlError(control, this.submitted());

    if (
      !showError &&
      !(field === 'confirmPassword' && this.hasPasswordMismatch())
    ) {
      return null;
    }

    if (field === 'password') {
      return getPasswordErrorMessage(control);
    }

    if (control?.hasError('required')) {
      return 'Debes confirmar la contraseña.';
    }

    if (this.hasPasswordMismatch()) {
      return 'Las contraseñas no coinciden.';
    }

    return null;
  }

  private hasPasswordMismatch(): boolean {
    return (
      this.activateForm.hasError('passwordMismatch') &&
      (this.submitted() ||
        !!this.activateForm.get('confirmPassword')?.dirty ||
        !!this.activateForm.get('confirmPassword')?.touched)
    );
  }

  private getTokenFromQueryParam(): string | null {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    return token || null;
  }
}
