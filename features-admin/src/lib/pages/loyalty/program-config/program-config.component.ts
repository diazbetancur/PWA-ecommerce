import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '@pwa/shared';
import {
  LoyaltyProgramConfigDto,
  UpdateLoyaltyConfigRequest,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';

/**
 * ⚙️ Página de Configuración del Programa de Lealtad
 *
 * Permite a los administradores configurar:
 * - Factor de conversión de puntos (conversionRate)
 * - Días de expiración de puntos
 * - Monto mínimo de compra para obtener puntos
 * - Activar/desactivar el programa
 */
@Component({
  selector: 'lib-program-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './program-config.component.html',
  styleUrl: './program-config.component.scss',
})
export class ProgramConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  configForm!: FormGroup;
  config = signal<LoyaltyProgramConfigDto | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  currencyAmount = signal(100); // Valor inicial: $100

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.isLoading.set(true);
    this.loyaltyAdminService.getProgramConfig().subscribe({
      next: (config) => {
        console.log('✅ Configuración cargada:', config);
        this.config.set(config);
        this.initForm(config);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error cargando configuración:', err);
        this.toastService.error(
          `No se pudo cargar la configuración: ${
            err.status || 'Error desconocido'
          }`
        );

        // Configuración por defecto para poder ver el formulario
        const defaultConfig: LoyaltyProgramConfigDto = {
          id: '',
          isEnabled: true,
          conversionRate: 0.01,
          pointsExpirationDays: 365,
          minPurchaseForPoints: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('⚠️ Usando configuración por defecto:', defaultConfig);
        this.config.set(defaultConfig);
        this.initForm(defaultConfig);
        this.isLoading.set(false);
      },
    });
  }

  private initForm(config: LoyaltyProgramConfigDto): void {
    this.configForm = this.fb.group({
      isEnabled: [config.isEnabled],
      conversionRate: [
        config.conversionRate,
        [Validators.required, Validators.min(0.000001)],
      ],
      pointsExpirationDays: [config.pointsExpirationDays || null],
      minPurchaseForPoints: [config.minPurchaseForPoints || null],
    });

    // Calculate initial currency amount from conversion rate
    if (config.conversionRate > 0) {
      // Si conversionRate = 0.01, entonces currencyAmount = 1 / 0.01 = 100
      this.currencyAmount.set(Math.round(1 / config.conversionRate));
    }
  }

  onCurrencyAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const amount = Number.parseFloat(input.value) || 1;
    this.currencyAmount.set(amount);

    // Calculate conversion rate
    // Si el usuario ingresa $100, entonces conversionRate = 1 / 100 = 0.01
    // Esto significa: 1 punto por cada $100
    const conversionRate = 1 / amount;
    this.configForm.patchValue({
      conversionRate: conversionRate,
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      return;
    }

    this.isSaving.set(true);

    const request: UpdateLoyaltyConfigRequest = {
      isEnabled: this.configForm.value.isEnabled,
      conversionRate: this.configForm.value.conversionRate,
      pointsExpirationDays: this.configForm.value.pointsExpirationDays || null,
      minPurchaseForPoints: this.configForm.value.minPurchaseForPoints || null,
    };

    this.loyaltyAdminService.updateProgramConfig(request).subscribe({
      next: (updated) => {
        this.config.set(updated);
        this.toastService.success('Configuración guardada exitosamente');
        this.isSaving.set(false);
        // No redireccionamos, nos quedamos en la misma vista
      },
      error: (err) => {
        console.error('Error guardando configuración:', err);
        this.toastService.error('No se pudo guardar la configuración');
        this.isSaving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/tenant-admin/loyalty/dashboard']);
  }
}
