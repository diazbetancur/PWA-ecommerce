import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppEnvService, TenantConfigService } from '@pwa/core';
import {
  ConfirmationDialogService,
  extractApiErrorMessage,
  ToastService,
} from '@pwa/shared';
import { finalize } from 'rxjs/operators';
import {
  TenantBrandingColorSettings,
  TenantBrandingSettings,
  TenantLocaleSettings,
  TenantSettingsDto,
  UpdateTenantBrandingRequest,
} from '../../../models/tenant-settings.model';
import { TenantSettingsService } from '../../../services/tenant-settings.service';

@Component({
  selector: 'lib-branding-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './branding-settings.component.html',
  styleUrl: './branding-settings.component.scss',
})
export class BrandingSettingsComponent implements OnInit, OnDestroy {
  private readonly defaultLocale = 'es-HN';
  private readonly defaultCurrency = 'HNL';
  private readonly fb = inject(FormBuilder);
  private readonly appEnv = inject(AppEnvService);
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly toastService = inject(ToastService);
  private createdLogoObjectUrl: string | null = null;
  private createdFaviconObjectUrl: string | null = null;

  readonly currencyOptions = [
    {
      code: 'HNL',
      label: 'Lempira hondureno',
      symbol: 'L',
    },
    {
      code: 'USD',
      label: 'Dolar estadounidense',
      symbol: '$',
    },
  ] as const;
  readonly fieldHelpText = {
    logo: 'Sube el logo principal de tu negocio. Se usa para identificar tu tienda visualmente.',
    favicon:
      'Es el icono pequeno que aparece en la pestana del navegador y en favoritos.',
    primaryColor:
      'Es el color principal de tu marca. Suele verse en botones y elementos destacados.',
    secondaryColor:
      'Es un color de apoyo para combinar tu identidad visual en la tienda.',
    accentColor:
      'Sirve para resaltar detalles o puntos de atencion dentro de la interfaz.',
    backgroundColor:
      'Define el color base de fondo para mantener una apariencia clara y consistente.',
    email:
      'Correo principal para que tus clientes sepan como comunicarse con tu negocio.',
    phone:
      'Numero principal de contacto del negocio para llamadas o consultas.',
    whatsApp:
      'Numero o enlace de WhatsApp para atencion rapida con tus clientes.',
    address:
      'Direccion fisica del negocio, si deseas mostrar un punto de referencia o ubicacion.',
    facebook: 'Enlace publico a la pagina de Facebook de tu negocio.',
    instagram:
      'Enlace publico al perfil de Instagram que quieres mostrar en tu tienda.',
    twitter: 'Enlace publico a tu perfil de X o Twitter.',
    tikTok: 'Enlace publico al perfil de TikTok de tu negocio.',
    currency:
      'Moneda base en la que se mostraran los precios y montos de tu tienda.',
    currencySymbol:
      'Simbolo que acompana los precios. Se completa automaticamente segun la moneda elegida.',
    taxRate:
      'Porcentaje de impuesto que usaras como referencia en tus calculos o visualizacion.',
    seoTitle:
      'Titulo con el que tu tienda puede aparecer en buscadores y en la pestana del navegador.',
    seoDescription:
      'Descripcion corta de tu tienda para buscadores y vistas compartidas.',
    seoKeywords:
      'Palabras clave relacionadas con tu negocio para describir mejor su contenido.',
  } as const;

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<'branding' | 'contact' | 'social' | 'advanced'>(
    'branding'
  );
  readonly selectedLogoFile = signal<File | null>(null);
  readonly selectedFaviconFile = signal<File | null>(null);
  readonly existingLogoUrl = signal<string | null>(null);
  readonly existingFaviconUrl = signal<string | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly faviconPreviewUrl = signal<string | null>(null);
  readonly savingSection = signal<
    'branding' | 'contact' | 'social' | 'locale' | 'seo' | null
  >(null);
  readonly maxBrandingImageSizeMb = this.appEnv.categoryImageMaxSizeMb;
  readonly maxBrandingImageSizeBytes =
    this.maxBrandingImageSizeMb * 1024 * 1024;
  readonly displayLogoUrl = computed(
    () => this.logoPreviewUrl() || this.existingLogoUrl()
  );
  readonly displayFaviconUrl = computed(
    () => this.faviconPreviewUrl() || this.existingFaviconUrl()
  );

  readonly settingsForm: FormGroup = this.fb.group({
    branding: this.fb.group({
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
      locale: [this.defaultLocale, [Validators.required]],
      currency: [this.defaultCurrency, [Validators.required]],
      currencySymbol: ['L', [Validators.required]],
      taxRate: [
        19,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    }),
    seo: this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      keywords: [''],
    }),
  });

  ngOnInit(): void {
    this.applyCurrencyDefaults(this.defaultCurrency);
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.revokeLogoObjectUrl();
    this.revokeFaviconObjectUrl();
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
        const message = extractApiErrorMessage(error);
        this.errorMessage.set(message);
        this.toastService.error(message);
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
    this.tenantSettingsService
      .updateBranding(this.buildBrandingPayload())
      .pipe(finalize(() => this.savingSection.set(null)))
      .subscribe({
        next: (branding) => {
          this.applyBrandingSettings(branding);
          this.toastService.success('Branding actualizado correctamente');
        },
        error: (error) => {
          this.toastService.error(extractApiErrorMessage(error));
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
        this.toastService.error(extractApiErrorMessage(error));
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
        this.toastService.error(extractApiErrorMessage(error));
        this.savingSection.set(null);
      },
    });
  }

  saveLocale(): void {
    const group = this.settingsForm.get('locale');
    if (!group || group.invalid) {
      group?.markAllAsTouched();
      this.toastService.warning('Revisa los campos de moneda e impuestos.');
      return;
    }

    this.savingSection.set('locale');
    this.tenantSettingsService
      .updateSettings({
        locale: this.normalizeLocaleSettings(group.getRawValue()),
      })
      .pipe(finalize(() => this.savingSection.set(null)))
      .subscribe({
        next: (settings) => {
          this.applySettings(settings);
          this.toastService.success(
            'Moneda e impuestos actualizados correctamente'
          );
        },
        error: (error) => {
          this.toastService.error(extractApiErrorMessage(error));
        },
      });
  }

  saveSeo(): void {
    const group = this.settingsForm.get('seo');
    if (!group || group.invalid) {
      group?.markAllAsTouched();
      this.toastService.warning('Revisa los campos de SEO.');
      return;
    }

    this.savingSection.set('seo');
    this.tenantSettingsService
      .updateSettings({
        seo: group.getRawValue(),
      })
      .pipe(finalize(() => this.savingSection.set(null)))
      .subscribe({
        next: (settings) => {
          this.applySettings(settings);
          this.toastService.success('SEO actualizado correctamente');
        },
        error: (error) => {
          this.toastService.error(extractApiErrorMessage(error));
        },
      });
  }

  isSaving(
    section: 'branding' | 'contact' | 'social' | 'locale' | 'seo'
  ): boolean {
    return this.savingSection() === section;
  }

  setTab(tab: 'branding' | 'contact' | 'social' | 'advanced'): void {
    this.activeTab.set(tab);
  }

  onCurrencyChange(): void {
    const currency = this.settingsForm.get('locale.currency')?.value;
    this.applyCurrencyDefaults(currency);
  }

  onLogoSelected(event: Event): void {
    this.handleBrandingImageSelection(event, 'logo');
  }

  onFaviconSelected(event: Event): void {
    this.handleBrandingImageSelection(event, 'favicon');
  }

  clearSelectedLogo(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.selectedLogoFile.set(null);
    this.logoPreviewUrl.set(null);
    this.revokeLogoObjectUrl();
  }

  clearSelectedFavicon(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.selectedFaviconFile.set(null);
    this.faviconPreviewUrl.set(null);
    this.revokeFaviconObjectUrl();
  }

  private applySettings(
    settings: TenantSettingsDto,
    options?: { resetBrandingUploads?: boolean }
  ): void {
    const normalizedLocale = this.normalizeLocaleSettings(settings.locale);

    this.settingsForm.patchValue({
      branding: this.extractBrandingColorSettings(settings.branding),
      contact: settings.contact,
      social: settings.social,
      locale: normalizedLocale,
      seo: settings.seo,
    });

    this.applyBrandingSettings(
      settings.branding,
      options?.resetBrandingUploads ?? true
    );
    this.applyCurrencyDefaults(normalizedLocale.currency);
  }

  private applyBrandingSettings(
    branding: TenantBrandingSettings,
    resetUploads = true
  ): void {
    this.settingsForm
      .get('branding')
      ?.patchValue(this.extractBrandingColorSettings(branding));
    this.existingLogoUrl.set(branding.logoUrl || null);
    this.existingFaviconUrl.set(branding.faviconUrl || null);
    this.tenantConfigService.updateRuntimeBranding(branding);

    if (resetUploads) {
      this.resetBrandingUploadState();
    }
  }

  private buildBrandingPayload(): UpdateTenantBrandingRequest {
    const branding = this.extractBrandingColorSettings(
      this.settingsForm
        .get('branding')
        ?.getRawValue() as TenantBrandingColorSettings
    );

    return {
      ...branding,
      logo: this.selectedLogoFile(),
      favicon: this.selectedFaviconFile(),
    };
  }

  private buildBrandingFilesPayload(): UpdateTenantBrandingRequest {
    return {
      logo: this.selectedLogoFile(),
      favicon: this.selectedFaviconFile(),
    };
  }

  private normalizeLocaleSettings(
    locale?: Partial<TenantLocaleSettings> | null
  ): TenantLocaleSettings {
    const currency = this.normalizeCurrency(locale?.currency);

    return {
      locale: this.defaultLocale,
      currency,
      currencySymbol: this.getCurrencySymbol(currency),
      taxRate: locale?.taxRate ?? 19,
    };
  }

  private applyCurrencyDefaults(currency?: string | null): void {
    const normalizedCurrency = this.normalizeCurrency(currency);

    this.settingsForm.get('locale')?.patchValue(
      {
        locale: this.defaultLocale,
        currency: normalizedCurrency,
        currencySymbol: this.getCurrencySymbol(normalizedCurrency),
      },
      { emitEvent: false }
    );
  }

  private normalizeCurrency(currency?: string | null): 'HNL' | 'USD' {
    return currency === 'USD' ? 'USD' : 'HNL';
  }

  private getCurrencySymbol(currency: 'HNL' | 'USD'): string {
    return currency === 'USD' ? '$' : 'L';
  }

  private handleBrandingImageSelection(
    event: Event,
    target: 'logo' | 'favicon'
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.clearBrandingSelection(target);
      return;
    }

    if (!this.isSupportedImageFile(file)) {
      this.toastService.warning('Solo se permiten archivos de imagen válidos.');
      input.value = '';
      this.clearBrandingSelection(target);
      return;
    }

    if (file.size <= 0) {
      this.toastService.warning('El archivo seleccionado esta vacio.');
      input.value = '';
      this.clearBrandingSelection(target);
      return;
    }

    if (file.size > this.maxBrandingImageSizeBytes) {
      this.confirmDialog.alert(
        'Imagen demasiado grande',
        `La imagen supera el limite de ${this.maxBrandingImageSizeMb} MB.`
      );
      input.value = '';
      this.clearBrandingSelection(target);
      return;
    }

    if (target === 'logo') {
      this.selectedLogoFile.set(file);
      this.revokeLogoObjectUrl();
      this.createdLogoObjectUrl = URL.createObjectURL(file);
      this.logoPreviewUrl.set(this.createdLogoObjectUrl);
      return;
    }

    this.selectedFaviconFile.set(file);
    this.revokeFaviconObjectUrl();
    this.createdFaviconObjectUrl = URL.createObjectURL(file);
    this.faviconPreviewUrl.set(this.createdFaviconObjectUrl);
  }

  private clearBrandingSelection(target: 'logo' | 'favicon'): void {
    if (target === 'logo') {
      this.selectedLogoFile.set(null);
      this.logoPreviewUrl.set(null);
      this.revokeLogoObjectUrl();
      return;
    }

    this.selectedFaviconFile.set(null);
    this.faviconPreviewUrl.set(null);
    this.revokeFaviconObjectUrl();
  }

  private extractBrandingColorSettings(
    branding:
      | Partial<TenantBrandingSettings>
      | Partial<TenantBrandingColorSettings>
  ): TenantBrandingColorSettings {
    return {
      primaryColor: branding.primaryColor || '#3b82f6',
      secondaryColor: branding.secondaryColor || '#1e40af',
      accentColor: branding.accentColor || '#10b981',
      backgroundColor: branding.backgroundColor || '#ffffff',
    };
  }

  private resetBrandingUploadState(): void {
    this.selectedLogoFile.set(null);
    this.selectedFaviconFile.set(null);
    this.logoPreviewUrl.set(null);
    this.faviconPreviewUrl.set(null);
    this.revokeLogoObjectUrl();
    this.revokeFaviconObjectUrl();
  }

  private revokeLogoObjectUrl(): void {
    if (this.createdLogoObjectUrl) {
      URL.revokeObjectURL(this.createdLogoObjectUrl);
      this.createdLogoObjectUrl = null;
    }
  }

  private revokeFaviconObjectUrl(): void {
    if (this.createdFaviconObjectUrl) {
      URL.revokeObjectURL(this.createdFaviconObjectUrl);
      this.createdFaviconObjectUrl = null;
    }
  }

  private isSupportedImageFile(file: File): boolean {
    return file.type.startsWith('image/') || /\.ico$/i.test(file.name);
  }
}
