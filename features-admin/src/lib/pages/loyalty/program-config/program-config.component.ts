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
 * - Factor de conversión de puntos (ej: 1 punto cada 1000 pesos)
 * - Umbrales de puntos para cada tier
 * - Días de expiración de puntos
 * - Puntos mínimos para canjear
 * - Activar/desactivar el programa
 */
@Component({
  selector: 'lib-program-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="program-config-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button class="back-btn" (click)="goBack()">
            <span>←</span> Volver
          </button>
          <div>
            <h1>⚙️ Configuración del Programa</h1>
            <p class="subtitle">
              Gestiona el factor de conversión, tiers y reglas del programa
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando configuración...</p>
      </div>
      }

      <!-- Form -->
      @if (!isLoading() && configForm) {
      <form
        [formGroup]="configForm"
        (ngSubmit)="onSubmit()"
        class="config-form"
      >
        <!-- Estado del Programa -->
        <div class="form-section">
          <h2>📊 Estado del Programa</h2>
          <div class="form-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                formControlName="isActive"
                class="toggle-checkbox"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-text">Programa Activo</span>
            </label>
            <p class="help-text">
              Cuando está desactivado, los usuarios no pueden ganar ni canjear
              puntos
            </p>
          </div>
        </div>

        <!-- Factor de Conversión -->
        <div class="form-section">
          <h2>💰 Factor de Conversión</h2>
          <div class="conversion-info">
            <p class="info-text">
              Define cuántos puntos se otorgan por cada compra
            </p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="currencyAmount">
                Monto en {{ config()?.currency || 'COP' }}
              </label>
              <input
                type="number"
                id="currencyAmount"
                class="form-control"
                [value]="currencyAmount()"
                (input)="onCurrencyAmountChange($event)"
                min="1"
                step="100"
              />
              <p class="help-text">Ej: 1000 (mil pesos)</p>
            </div>

            <div class="equals-sign">=</div>

            <div class="form-group">
              <label for="pointsPerCurrencyUnit">Puntos Otorgados</label>
              <input
                type="number"
                id="pointsPerCurrencyUnit"
                class="form-control"
                formControlName="pointsPerCurrencyUnit"
                min="0.000001"
                step="0.000001"
                readonly
              />
              <p class="help-text">Calculado automáticamente</p>
            </div>
          </div>

          <div class="conversion-example">
            <strong>Ejemplo:</strong> Una compra de
            {{ config()?.currency || 'COP' }}
            {{ currencyAmount() * 5 | number : '1.0-0' }} otorgará
            <strong>
              {{
                currencyAmount() *
                  5 *
                  (configForm.get('pointsPerCurrencyUnit')?.value || 0)
                  | number : '1.0-2'
              }}
            </strong>
            puntos
          </div>
        </div>

        <!-- Configuración de Tiers -->
        <div class="form-section">
          <h2>🏆 Umbrales de Tiers</h2>
          <p class="section-description">
            Define los puntos lifetime necesarios para alcanzar cada nivel
          </p>

          <div class="tiers-grid">
            <div class="tier-item bronze">
              <div class="tier-icon">🥉</div>
              <label for="bronzeTierThreshold">Bronce</label>
              <input
                type="number"
                id="bronzeTierThreshold"
                class="form-control"
                formControlName="bronzeTierThreshold"
                min="0"
              />
              <p class="help-text">Puntos mínimos</p>
            </div>

            <div class="tier-item silver">
              <div class="tier-icon">🥈</div>
              <label for="silverTierThreshold">Plata</label>
              <input
                type="number"
                id="silverTierThreshold"
                class="form-control"
                formControlName="silverTierThreshold"
                min="0"
              />
              <p class="help-text">Puntos mínimos</p>
            </div>

            <div class="tier-item gold">
              <div class="tier-icon">🥇</div>
              <label for="goldTierThreshold">Oro</label>
              <input
                type="number"
                id="goldTierThreshold"
                class="form-control"
                formControlName="goldTierThreshold"
                min="0"
              />
              <p class="help-text">Puntos mínimos</p>
            </div>

            <div class="tier-item platinum">
              <div class="tier-icon">💎</div>
              <label for="platinumTierThreshold">Platino</label>
              <input
                type="number"
                id="platinumTierThreshold"
                class="form-control"
                formControlName="platinumTierThreshold"
                min="0"
              />
              <p class="help-text">Puntos mínimos</p>
            </div>
          </div>
        </div>

        <!-- Reglas del Programa -->
        <div class="form-section">
          <h2>📋 Reglas del Programa</h2>

          <div class="form-group">
            <label for="minimumPointsToRedeem"
              >Puntos Mínimos para Canjear</label
            >
            <input
              type="number"
              id="minimumPointsToRedeem"
              class="form-control"
              formControlName="minimumPointsToRedeem"
              min="0"
            />
            <p class="help-text">
              Los usuarios necesitan al menos esta cantidad para canjear premios
            </p>
          </div>

          <div class="form-group">
            <label for="pointsExpirationDays">
              Días de Expiración de Puntos
            </label>
            <input
              type="number"
              id="pointsExpirationDays"
              class="form-control"
              formControlName="pointsExpirationDays"
              min="0"
              placeholder="Dejar vacío para puntos que no expiran"
            />
            <p class="help-text">
              Los puntos expirarán después de este número de días. Dejar vacío
              para que no expiren nunca.
            </p>
          </div>
        </div>

        <!-- Términos y Condiciones -->
        <div class="form-section">
          <h2>📄 Términos y Condiciones</h2>
          <div class="form-group">
            <textarea
              id="termsAndConditions"
              class="form-control textarea"
              formControlName="termsAndConditions"
              rows="6"
              placeholder="Ingresa los términos y condiciones del programa..."
            ></textarea>
            <p class="help-text">
              Términos mostrados a los usuarios al participar en el programa
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!configForm.valid || isSaving()"
          >
            @if (isSaving()) {
            <span class="spinner-sm"></span>
            } @else {
            <span>💾</span>
            } Guardar Configuración
          </button>
        </div>
      </form>
      }
    </div>
  `,
  styles: [
    `
      .program-config-page {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 30px;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .back-btn {
        padding: 8px 16px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s;
      }

      .back-btn:hover {
        background: #e0e0e0;
      }

      h1 {
        margin: 0;
        font-size: 1.8rem;
        color: #333;
      }

      .subtitle {
        margin: 5px 0 0;
        color: #666;
        font-size: 0.95rem;
      }

      .loading-container {
        text-align: center;
        padding: 60px 20px;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--tenant-primary-color, #667eea);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .config-form {
        background: white;
        border-radius: 12px;
        overflow: hidden;
      }

      .form-section {
        padding: 30px;
        border-bottom: 1px solid #e0e0e0;
      }

      .form-section:last-of-type {
        border-bottom: none;
      }

      .form-section h2 {
        margin: 0 0 15px;
        font-size: 1.4rem;
        color: #333;
      }

      .section-description {
        margin: 0 0 20px;
        color: #666;
        font-size: 0.95rem;
      }

      .form-group {
        margin-bottom: 20px;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #444;
        font-size: 0.95rem;
      }

      .form-control {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 0.95rem;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--tenant-primary-color, #667eea);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-control:disabled,
      .form-control:read-only {
        background: #f5f5f5;
        color: #999;
      }

      .textarea {
        resize: vertical;
        min-height: 120px;
        font-family: inherit;
      }

      .help-text {
        margin: 5px 0 0;
        font-size: 0.85rem;
        color: #999;
      }

      /* Toggle Switch */
      .toggle-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        user-select: none;
      }

      .toggle-checkbox {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 50px;
        height: 26px;
        background: #ccc;
        border-radius: 13px;
        transition: background 0.3s;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        top: 3px;
        left: 3px;
        transition: transform 0.3s;
      }

      .toggle-checkbox:checked + .toggle-slider {
        background: var(--tenant-primary-color, #667eea);
      }

      .toggle-checkbox:checked + .toggle-slider::before {
        transform: translateX(24px);
      }

      .toggle-text {
        font-weight: 500;
        color: #333;
      }

      /* Conversion Section */
      .conversion-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .info-text {
        margin: 0;
        color: #666;
        font-size: 0.95rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 20px;
        align-items: end;
      }

      .equals-sign {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--tenant-primary-color, #667eea);
        padding-bottom: 12px;
      }

      .conversion-example {
        background: #e8f5e9;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        color: #2e7d32;
      }

      .conversion-example strong {
        color: #1b5e20;
      }

      /* Tiers Grid */
      .tiers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }

      .tier-item {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.2s;
      }

      .tier-item.bronze {
        border-color: #cd7f32;
      }

      .tier-item.silver {
        border-color: #c0c0c0;
      }

      .tier-item.gold {
        border-color: #ffd700;
      }

      .tier-item.platinum {
        border-color: #e5e4e2;
      }

      .tier-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .tier-item label {
        text-align: center;
        font-weight: 600;
        margin-bottom: 10px;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        padding: 20px 30px;
        background: #f8f9fa;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .btn-primary {
        background: var(--tenant-primary-color, #667eea);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--tenant-primary-dark, #5568d3);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }

      .btn-secondary:hover {
        background: #e0e0e0;
      }

      .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .program-config-page {
          padding: 15px;
        }

        .form-section {
          padding: 20px 15px;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .equals-sign {
          display: none;
        }

        .tiers-grid {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }

        .btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class ProgramConfigComponent implements OnInit {
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  // Signals
  config = signal<LoyaltyProgramConfigDto | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  currencyAmount = signal(1000); // Default: 1000 pesos

  configForm!: FormGroup;

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.isLoading.set(true);
    this.loyaltyAdminService.getProgramConfig().subscribe({
      next: (config) => {
        this.config.set(config);
        this.initForm(config);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading config:', error);
        this.toastService.error('Error al cargar la configuración');
        this.isLoading.set(false);
      },
    });
  }

  private initForm(config: LoyaltyProgramConfigDto): void {
    this.configForm = this.fb.group({
      pointsPerCurrencyUnit: [
        config.pointsPerCurrencyUnit,
        [Validators.required, Validators.min(0.000001)],
      ],
      minimumPointsToRedeem: [
        config.minimumPointsToRedeem,
        [Validators.required, Validators.min(0)],
      ],
      pointsExpirationDays: [config.pointsExpirationDays],
      bronzeTierThreshold: [
        config.bronzeTierThreshold,
        [Validators.required, Validators.min(0)],
      ],
      silverTierThreshold: [
        config.silverTierThreshold,
        [Validators.required, Validators.min(0)],
      ],
      goldTierThreshold: [
        config.goldTierThreshold,
        [Validators.required, Validators.min(0)],
      ],
      platinumTierThreshold: [
        config.platinumTierThreshold,
        [Validators.required, Validators.min(0)],
      ],
      isActive: [config.isActive],
      termsAndConditions: [config.termsAndConditions],
    });

    // Calculate initial currency amount from points per currency unit
    if (config.pointsPerCurrencyUnit > 0) {
      this.currencyAmount.set(Math.round(1 / config.pointsPerCurrencyUnit));
    }
  }

  onCurrencyAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const amount = Number.parseFloat(input.value) || 1000;
    this.currencyAmount.set(amount);

    // Calculate points per currency unit (1 punto cada X pesos)
    const pointsPerUnit = 1 / amount;
    this.configForm.patchValue({
      pointsPerCurrencyUnit: pointsPerUnit,
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      return;
    }

    this.isSaving.set(true);

    const request: UpdateLoyaltyConfigRequest = {
      ...this.configForm.value,
    };

    this.loyaltyAdminService.updateProgramConfig(request).subscribe({
      next: (config) => {
        this.config.set(config);
        this.toastService.success('Configuración guardada exitosamente');
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error saving config:', error);
        this.toastService.error('Error al guardar la configuración');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    const currentConfig = this.config();
    if (currentConfig) {
      this.initForm(currentConfig);
      this.toastService.info('Cambios descartados');
    }
  }

  goBack(): void {
    this.router.navigate(['/tenant-admin/loyalty/dashboard']);
  }
}
