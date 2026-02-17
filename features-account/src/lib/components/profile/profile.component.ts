import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models';
import { AccountService } from '../../services';

@Component({
  selector: 'lib-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  readonly user = signal<User | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly activeTab = signal<'profile' | 'password'>('profile');

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: [{ value: '', disabled: true }],
    phoneNumber: [''],
    documentType: [''],
    documentNumber: [''],
    birthDate: [''],
    address: [''],
    city: [''],
    country: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly isLoading = signal(false);

  constructor() {
    // Sincronizar con estado del servicio
    effect(() => {
      this.isLoading.set(this.accountService.state().isLoading);
    });
  }

  ngOnInit(): void {
    void this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    try {
      const user = await this.accountService.getProfile();
      this.user.set(user);
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        documentType: user.documentType || '',
        documentNumber: user.documentNumber || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
      });
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al cargar perfil'
      );
    }
  }

  toggleEditMode(): void {
    this.isEditMode.update((v) => !v);
    if (!this.isEditMode()) {
      // Cancelar edición, restaurar valores
      const user = this.user();
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber || '',
          documentType: user.documentType || '',
          documentNumber: user.documentNumber || '',
          birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
          address: user.address || '',
          city: user.city || '',
          country: user.country || '',
        });
      }
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const values = this.profileForm.getRawValue();
      const updatedUser = await this.accountService.updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        documentType: values.documentType || undefined,
        documentNumber: values.documentNumber || undefined,
        birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        country: values.country || undefined,
      });
      this.user.set(updatedUser);
      this.isEditMode.set(false);
      this.successMessage.set('Perfil actualizado correctamente');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al actualizar perfil'
      );
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const values = this.passwordForm.getRawValue();
    if (values.newPassword !== values.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.accountService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      this.passwordForm.reset();
      this.successMessage.set('Contraseña cambiada correctamente');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Error al cambiar contraseña'
      );
    }
  }

  async logout(): Promise<void> {
    await this.accountService.logout();
  }

  switchTab(tab: 'profile' | 'password'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
