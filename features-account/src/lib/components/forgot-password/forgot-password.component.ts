import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../services';

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

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

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
        'Se ha enviado un enlace de recuperación a tu email'
      );
      this.forgotForm.reset();
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
    if (!control?.touched) return null;

    if (control.hasError('required')) {
      return 'Email es requerido';
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    return null;
  }
}
