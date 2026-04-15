import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { extractApiErrorMessage, ToastService } from '@pwa/shared';
import {
  LoyaltyPointsPaymentConfigDto,
  LoyaltyProgramConfigDto,
  UpdateLoyaltyConfigRequest,
  UpdateLoyaltyPointsPaymentConfigRequest,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';
import { TenantSettingsService } from '../../../services/tenant-settings.service';

type LoyaltyConfigTab = 'earn' | 'payment';

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
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  earnConfigForm!: FormGroup;
  pointsPaymentForm!: FormGroup;

  readonly activeTab = signal<LoyaltyConfigTab>('earn');
  readonly earnConfig = signal<LoyaltyProgramConfigDto | null>(null);
  readonly pointsPaymentConfig = signal<LoyaltyPointsPaymentConfigDto | null>(
    null
  );
  readonly isLoadingEarnConfig = signal(false);
  readonly isLoadingPointsPaymentConfig = signal(false);
  readonly isSavingEarnConfig = signal(false);
  readonly isSavingPointsPaymentConfig = signal(false);
  readonly pointsPaymentLoadError = signal<string | null>(null);
  currencyAmount = signal(100); // Valor inicial: $100
  currencyCode = signal('COP');
  currencySymbol = signal('$');

  readonly pointsPaymentCurrency = computed(
    () => this.pointsPaymentConfig()?.currency || this.currencyCode()
  );

  ngOnInit(): void {
    this.loadTenantCurrency();
    this.loadEarnConfig();
    this.loadPointsPaymentConfig();
  }

  selectTab(tab: LoyaltyConfigTab): void {
    this.activeTab.set(tab);
  }

  private loadTenantCurrency(): void {
    this.tenantSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.currencyCode.set(
          settings.locale?.currency ||
            settings.loyaltyPointsPayment?.currency ||
            'COP'
        );
        this.currencySymbol.set(settings.locale?.currencySymbol || '$');
      },
      error: () => {
        // Fallback silencioso para no bloquear la configuración del programa
      },
    });
  }

  private loadEarnConfig(): void {
    this.isLoadingEarnConfig.set(true);
    this.loyaltyAdminService.getProgramConfig().subscribe({
      next: (config) => {
        this.earnConfig.set(config);
        this.initEarnConfigForm(config);
        this.isLoadingEarnConfig.set(false);
      },
      error: (err) => {
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

        this.earnConfig.set(defaultConfig);
        this.initEarnConfigForm(defaultConfig);
        this.isLoadingEarnConfig.set(false);
      },
    });
  }

  private loadPointsPaymentConfig(): void {
    this.isLoadingPointsPaymentConfig.set(true);
    this.pointsPaymentLoadError.set(null);

    this.loyaltyAdminService.getPointsPaymentConfig().subscribe({
      next: (config) => {
        this.pointsPaymentConfig.set(config);
        this.initPointsPaymentForm(config);
        this.isLoadingPointsPaymentConfig.set(false);
      },
      error: (err) => {
        this.toastService.error(
          `No se pudo cargar la configuración de puntos a dinero: ${
            err.status || 'Error desconocido'
          }`
        );
        this.pointsPaymentLoadError.set(
          'No se pudo cargar la configuración de puntos a dinero.'
        );
        this.isLoadingPointsPaymentConfig.set(false);
      },
    });
  }

  private initEarnConfigForm(config: LoyaltyProgramConfigDto): void {
    this.earnConfigForm = this.fb.group({
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

  private initPointsPaymentForm(config: LoyaltyPointsPaymentConfigDto): void {
    this.pointsPaymentForm = this.fb.group({
      isEnabled: [config.isEnabled],
      moneyPerPoint: [
        config.moneyPerPoint,
        [Validators.required, Validators.min(0.000001)],
      ],
      allowCombineWithCoupons: [config.allowCombineWithCoupons],
      maxMoneyPerTransaction: [
        config.maxMoneyPerTransaction,
        [Validators.min(0)],
      ],
      minimumPayableAmount: [
        config.minimumPayableAmount,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  onCurrencyAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const amount = Number.parseFloat(input.value) || 1;
    this.currencyAmount.set(amount);

    // Calculate conversion rate
    // Si el usuario ingresa $100, entonces conversionRate = 1 / 100 = 0.01
    // Esto significa: 1 punto por cada $100
    const conversionRate = 1 / amount;
    this.earnConfigForm.patchValue({
      conversionRate: conversionRate,
    });
  }

  onEarnConfigSubmit(): void {
    if (this.earnConfigForm.invalid) {
      return;
    }

    this.isSavingEarnConfig.set(true);

    const request: UpdateLoyaltyConfigRequest = {
      isEnabled: this.earnConfigForm.value.isEnabled,
      conversionRate: this.earnConfigForm.value.conversionRate,
      pointsExpirationDays:
        this.earnConfigForm.value.pointsExpirationDays || null,
      minPurchaseForPoints:
        this.earnConfigForm.value.minPurchaseForPoints || null,
    };

    this.loyaltyAdminService.updateProgramConfig(request).subscribe({
      next: (updated) => {
        this.earnConfig.set(updated);
        this.initEarnConfigForm(updated);
        this.toastService.success(
          'Configuración de compras a puntos guardada exitosamente'
        );
        this.isSavingEarnConfig.set(false);
      },
      error: (err) => {
        this.toastService.error(extractApiErrorMessage(err));
        this.isSavingEarnConfig.set(false);
      },
    });
  }

  onPointsPaymentSubmit(): void {
    if (this.pointsPaymentForm.invalid) {
      this.pointsPaymentForm.markAllAsTouched();
      return;
    }

    const moneyPerPoint = Number(this.pointsPaymentForm.value.moneyPerPoint);

    if (!Number.isFinite(moneyPerPoint) || moneyPerPoint <= 0) {
      this.toastService.warning(
        'El valor monetario por punto debe ser mayor que 0'
      );
      return;
    }

    this.isSavingPointsPaymentConfig.set(true);

    const request: UpdateLoyaltyPointsPaymentConfigRequest = {
      isEnabled: !!this.pointsPaymentForm.value.isEnabled,
      moneyPerPoint,
      allowCombineWithCoupons:
        !!this.pointsPaymentForm.value.allowCombineWithCoupons,
      maxMoneyPerTransaction: this.normalizeNonNegativeNumber(
        this.pointsPaymentForm.value.maxMoneyPerTransaction
      ),
      minimumPayableAmount: this.normalizeNonNegativeNumber(
        this.pointsPaymentForm.value.minimumPayableAmount
      ),
    };

    this.loyaltyAdminService.updatePointsPaymentConfig(request).subscribe({
      next: (updated) => {
        this.pointsPaymentConfig.set(updated);
        this.initPointsPaymentForm(updated);
        this.toastService.success(
          'Configuración de puntos a dinero guardada exitosamente'
        );
        this.isSavingPointsPaymentConfig.set(false);
      },
      error: (err) => {
        this.toastService.error(extractApiErrorMessage(err));
        this.isSavingPointsPaymentConfig.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/tenant-admin/loyalty/dashboard']);
  }

  retryPointsPaymentLoad(): void {
    this.loadPointsPaymentConfig();
  }

  private normalizeNonNegativeNumber(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return parsed;
  }
}
