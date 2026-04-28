import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TenantContextService } from '@pwa/core';
import { AccountService } from '../../services';
import { shouldShowControlError } from '../../utils/password-form.utils';

@Component({
  selector: 'lib-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly tenantContext = inject(TenantContextService);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly tenantConfigData = computed(() =>
    this.tenantContext.getTenantConfigOrDefault()
  );
  readonly tenantName = computed(
    () => this.tenantConfigData().tenant.displayName
  );

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
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
        'Si la cuenta existe, enviaremos instrucciones al correo asociado.'
      );
      this.forgotForm.reset();
      this.submitted.set(false);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Error al solicitar recuperación'
      );
    }
  }

  getFieldError(field: 'email'): string | null {
    const control = this.forgotForm.get(field);
    if (!shouldShowControlError(control, this.submitted())) {
      return null;
    }

    if (!control) {
      return null;
    }

    if (control.hasError('required')) {
      return 'El email es requerido.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo válido.';
    }

    return null;
  }
}
