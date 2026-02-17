import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '@pwa/shared';
import { TenantSettingsDto } from '../../../models/tenant-settings.model';
import { TenantSettingsService } from '../../../services/tenant-settings.service';

@Component({
  selector: 'lib-branding-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branding-settings.component.html',
  styleUrl: './branding-settings.component.scss',
})
export class BrandingSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<'branding' | 'contact' | 'social' | 'advanced'>(
    'branding'
  );
  readonly savingSection = signal<'branding' | 'contact' | 'social' | 'all' | null>(null);

  readonly settingsForm: FormGroup = this.fb.group({
    branding: this.fb.group({
      logoUrl: ['', [Validators.required]],
      faviconUrl: [''],
      primaryColor: ['#3b82f6', [Validators.required]],
      secondaryColor: ['#1e40af', [Validators.required]],
      accentColor: ['#10b981', [Validators.required]],
      backgroundColor: ['#ffffff', [Validators.required]],
    }),
    contact: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      whatsApp: [''],
    }),
    social: this.fb.group({
      facebook: [''],
      instagram: [''],
      twitter: [''],
      tikTok: [''],
    }),
    locale: this.fb.group({
      locale: ['es-CO', [Validators.required]],
      currency: ['COP', [Validators.required]],
      currencySymbol: ['$', [Validators.required]],
      taxRate: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
    }),
    seo: this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      keywords: [''],
    }),
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tenantSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ||
            'No se pudo cargar la configuración del tenant.'
        );
        this.toastService.error('No se pudo cargar la configuración');
        this.isLoading.set(false);
      },
    });
  }

  saveBranding(): void {
    const group = this.settingsForm.get('branding');
    if (!group || group.invalid) {
      group?.markAllAsTouched();
      this.toastService.warning('Revisa los campos de Branding.');
      return;
    }

    this.savingSection.set('branding');
    this.tenantSettingsService.updateBranding(group.getRawValue()).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.toastService.success('Branding actualizado correctamente');
        this.savingSection.set(null);
      },
      error: (error) => {
        this.toastService.error(
          error?.error?.message || 'No se pudo actualizar branding'
        );
        this.savingSection.set(null);
      },
    });
  }

  saveContact(): void {
    const group = this.settingsForm.get('contact');
    if (!group || group.invalid) {
      group?.markAllAsTouched();
      this.toastService.warning('Revisa los campos de Contacto.');
      return;
    }

    this.savingSection.set('contact');
    this.tenantSettingsService.updateContact(group.getRawValue()).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.toastService.success('Contacto actualizado correctamente');
        this.savingSection.set(null);
      },
      error: (error) => {
        this.toastService.error(
          error?.error?.message || 'No se pudo actualizar contacto'
        );
        this.savingSection.set(null);
      },
    });
  }

  saveSocial(): void {
    const group = this.settingsForm.get('social');
    if (!group) {
      return;
    }

    this.savingSection.set('social');
    this.tenantSettingsService.updateSocial(group.getRawValue()).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.toastService.success('Redes sociales actualizadas correctamente');
        this.savingSection.set(null);
      },
      error: (error) => {
        this.toastService.error(
          error?.error?.message || 'No se pudo actualizar redes sociales'
        );
        this.savingSection.set(null);
      },
    });
  }

  saveAll(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.toastService.warning('Revisa los campos antes de guardar.');
      return;
    }

    this.savingSection.set('all');
    this.tenantSettingsService
      .updateSettings(this.settingsForm.getRawValue())
      .subscribe({
        next: (settings) => {
          this.applySettings(settings);
          this.toastService.success('Configuración actualizada correctamente');
          this.savingSection.set(null);
        },
        error: (error) => {
          this.toastService.error(
            error?.error?.message || 'No se pudo actualizar la configuración'
          );
          this.savingSection.set(null);
        },
      });
  }

  isSaving(section: 'branding' | 'contact' | 'social' | 'all'): boolean {
    return this.savingSection() === section;
  }

  setTab(tab: 'branding' | 'contact' | 'social' | 'advanced'): void {
    this.activeTab.set(tab);
  }

  private applySettings(settings: TenantSettingsDto): void {
    this.settingsForm.patchValue({
      branding: settings.branding,
      contact: settings.contact,
      social: settings.social,
      locale: settings.locale,
      seo: settings.seo,
    });
  }
}
