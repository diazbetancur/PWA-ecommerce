import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdjustPointsRequest,
  AdjustPointsResponse,
} from '../../../models/loyalty.models';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';

/**
 * ⚙️ Ajuste Manual de Puntos
 *
 * Permite al administrador:
 * - Agregar o deducir puntos manualmente a usuarios
 * - Proporcionar razón del ajuste
 * - Agregar referencia opcional
 * - Ver historial de ajustes recientes
 */
@Component({
  selector: 'lib-points-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="points-adjustment-page">
      <!-- Header -->
      <div class="page-header">
        <h1>⚙️ Ajuste de Puntos</h1>
        <p>Gestión manual de puntos de usuarios</p>
      </div>

      <div class="content-grid">
        <!-- Adjustment Form -->
        <div class="form-section">
          <h2>Realizar Ajuste</h2>

          <form (ngSubmit)="submitAdjustment()" #adjustmentForm="ngForm">
            <div class="form-group">
              <label for="userId">ID de Usuario *</label>
              <input
                type="text"
                id="userId"
                name="userId"
                [(ngModel)]="formData.userId"
                required
                placeholder="Ejemplo: user-123"
                class="form-input"
              />
              <small class="help-text"
                >El ID único del usuario en el sistema</small
              >
            </div>

            <div class="form-group">
              <label for="points">Cantidad de Puntos *</label>
              <input
                type="number"
                id="points"
                name="points"
                [(ngModel)]="formData.points"
                required
                placeholder="100 para agregar, -100 para deducir"
                class="form-input"
              />
              <small class="help-text">
                Número positivo para agregar, negativo para deducir
              </small>
            </div>

            <div class="form-group">
              <label for="reason">Razón del Ajuste *</label>
              <textarea
                id="reason"
                name="reason"
                [(ngModel)]="formData.reason"
                required
                rows="3"
                placeholder="Explica el motivo del ajuste..."
                class="form-textarea"
              ></textarea>
              <small class="help-text"
                >Esta razón quedará registrada en el historial</small
              >
            </div>

            <div class="form-group">
              <label for="referenceId">Referencia (Opcional)</label>
              <input
                type="text"
                id="referenceId"
                name="referenceId"
                [(ngModel)]="formData.referenceId"
                placeholder="Ejemplo: ORDER-456, TICKET-789"
                class="form-input"
              />
              <small class="help-text"
                >ID de orden, ticket o cualquier referencia relacionada</small
              >
            </div>

            <!-- Preview -->
            @if (formData.points !== 0) {
            <div class="adjustment-preview">
              <div class="preview-header">Vista Previa</div>
              <div class="preview-content">
                @if (formData.points > 0) {
                <div class="preview-action positive">
                  <span class="icon">⬆️</span>
                  <span
                    >Agregar <strong>{{ formData.points }}</strong> puntos</span
                  >
                </div>
                } @else {
                <div class="preview-action negative">
                  <span class="icon">⬇️</span>
                  <span
                    >Deducir
                    <strong>{{ Math.abs(formData.points) }}</strong>
                    puntos</span
                  >
                </div>
                }
              </div>
            </div>
            }

            <!-- Submit Button -->
            <div class="form-actions">
              <button
                type="submit"
                class="btn-primary"
                [disabled]="!adjustmentForm.form.valid || isSubmitting()"
              >
                @if (isSubmitting()) {
                <span class="spinner-sm"></span>
                Procesando... } @else { ✓ Confirmar Ajuste }
              </button>
              <button
                type="button"
                class="btn-secondary"
                (click)="resetForm()"
                [disabled]="isSubmitting()"
              >
                Limpiar
              </button>
            </div>
          </form>

          <!-- Success Message -->
          @if (successMessage()) {
          <div class="alert alert-success">
            <strong>¡Éxito!</strong> {{ successMessage() }}
          </div>
          }

          <!-- Error Message -->
          @if (errorMessage()) {
          <div class="alert alert-danger">
            <strong>Error:</strong> {{ errorMessage() }}
          </div>
          }
        </div>

        <!-- Info & Guidelines -->
        <div class="info-section">
          <h2>Guías de Uso</h2>

          <div class="info-card">
            <h3>⚠️ Consideraciones Importantes</h3>
            <ul>
              <li>
                Los ajustes manuales quedan registrados en el historial del
                usuario
              </li>
              <li>Siempre proporciona una razón clara y detallada</li>
              <li>
                No se puede deshacer un ajuste, solo se puede hacer un nuevo
                ajuste contrario
              </li>
              <li>
                Los usuarios verán este movimiento en su historial de
                transacciones
              </li>
            </ul>
          </div>

          <div class="info-card">
            <h3>📋 Casos de Uso Comunes</h3>
            <ul>
              <li>
                <strong>Compensación:</strong> Agregar puntos por inconvenientes
                o errores del sistema
              </li>
              <li>
                <strong>Corrección:</strong> Ajustar puntos otorgados
                incorrectamente
              </li>
              <li>
                <strong>Promoción especial:</strong> Bonificación por eventos o
                campañas
              </li>
              <li>
                <strong>Reembolso:</strong> Devolver puntos por canjes
                problemáticos
              </li>
            </ul>
          </div>

          <div class="info-card">
            <h3>💡 Mejores Prácticas</h3>
            <ul>
              <li>Verifica el ID del usuario antes de confirmar</li>
              <li>Revisa el balance actual antes del ajuste</li>
              <li>
                Usa referencias cuando estén disponibles (ORDER-XXX, TICKET-XXX)
              </li>
              <li>Sé específico en la razón del ajuste</li>
              <li>Documenta ajustes grandes en tu sistema de tickets</li>
            </ul>
          </div>

          <!-- Recent Adjustments -->
          <div class="recent-adjustments">
            <h3>🕒 Ajustes Recientes</h3>
            <div class="adjustments-list">
              @for (adj of mockRecentAdjustments; track adj.id) {
              <div class="adjustment-item">
                <div
                  class="adjustment-points"
                  [class.positive]="adj.points > 0"
                >
                  {{ adj.points > 0 ? '+' : '' }}{{ adj.points }}
                </div>
                <div class="adjustment-details">
                  <div class="user-id">Usuario: {{ adj.userId }}</div>
                  <div class="reason">{{ adj.reason }}</div>
                  <div class="time">{{ adj.time }}</div>
                </div>
              </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .points-adjustment-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 30px;
      }

      .page-header h1 {
        font-size: 2rem;
        color: #333;
        margin-bottom: 5px;
      }

      .page-header p {
        color: #6c757d;
      }

      /* Content Grid */
      .content-grid {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 30px;
      }

      /* Form Section */
      .form-section {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-section h2 {
        font-size: 1.5rem;
        margin-bottom: 25px;
        color: #333;
      }

      .form-group {
        margin-bottom: 25px;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-input,
      .form-textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
      }

      .form-input:focus,
      .form-textarea:focus {
        outline: none;
        border-color: #007bff;
      }

      .form-textarea {
        resize: vertical;
      }

      .help-text {
        display: block;
        margin-top: 6px;
        font-size: 0.85rem;
        color: #6c757d;
      }

      /* Adjustment Preview */
      .adjustment-preview {
        margin-bottom: 25px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }

      .preview-header {
        background: #f8f9fa;
        padding: 12px 15px;
        font-weight: 600;
        color: #495057;
        border-bottom: 1px solid #e0e0e0;
      }

      .preview-content {
        padding: 20px;
      }

      .preview-action {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.1rem;
      }

      .preview-action.positive {
        color: #28a745;
      }

      .preview-action.negative {
        color: #dc3545;
      }

      .preview-action .icon {
        font-size: 1.8rem;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        gap: 15px;
      }

      .btn-primary,
      .btn-secondary {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-primary {
        background: #007bff;
        color: white;
        flex: 1;
      }

      .btn-primary:hover:not(:disabled) {
        background: #0056b3;
      }

      .btn-primary:disabled {
        background: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .btn-secondary {
        background: #f8f9fa;
        color: #495057;
        border: 2px solid #dee2e6;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e9ecef;
      }

      .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      /* Alerts */
      .alert {
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
      }

      .alert-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .alert-danger {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      /* Info Section */
      .info-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .info-section h2 {
        font-size: 1.3rem;
        color: #333;
      }

      .info-card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .info-card h3 {
        font-size: 1.1rem;
        margin-bottom: 15px;
        color: #333;
      }

      .info-card ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .info-card li {
        padding: 8px 0;
        color: #495057;
        line-height: 1.5;
        border-bottom: 1px solid #f0f0f0;
      }

      .info-card li:last-child {
        border-bottom: none;
      }

      /* Recent Adjustments */
      .recent-adjustments {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .recent-adjustments h3 {
        font-size: 1.1rem;
        margin-bottom: 15px;
        color: #333;
      }

      .adjustments-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .adjustment-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .adjustment-points {
        font-size: 1.3rem;
        font-weight: bold;
        flex-shrink: 0;
      }

      .adjustment-points.positive {
        color: #28a745;
      }

      .adjustment-points:not(.positive) {
        color: #dc3545;
      }

      .adjustment-details {
        flex: 1;
      }

      .user-id {
        font-weight: 600;
        font-size: 0.9rem;
        color: #333;
        margin-bottom: 4px;
      }

      .reason {
        font-size: 0.85rem;
        color: #6c757d;
        margin-bottom: 4px;
      }

      .time {
        font-size: 0.75rem;
        color: #adb5bd;
      }

      /* Responsive */
      @media (max-width: 1200px) {
        .content-grid {
          grid-template-columns: 1fr;
        }

        .info-section {
          order: -1;
        }
      }
    `,
  ],
})
export class PointsAdjustmentComponent {
  private readonly loyaltyAdminService = inject(LoyaltyAdminService);

  // Signals
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Form data
  formData: AdjustPointsRequest = {
    userId: '',
    points: 0,
    reason: '',
    referenceId: '',
  };

  // Para acceder a Math.abs en el template
  Math = Math;

  // Mock data
  mockRecentAdjustments = [
    {
      id: '1',
      userId: 'user-123',
      points: 500,
      reason: 'Compensación por error en orden',
      time: 'Hace 10 min',
    },
    {
      id: '2',
      userId: 'user-456',
      points: -200,
      reason: 'Corrección de puntos duplicados',
      time: 'Hace 1 hora',
    },
    {
      id: '3',
      userId: 'user-789',
      points: 1000,
      reason: 'Bonificación especial Black Friday',
      time: 'Hace 2 horas',
    },
  ];

  /**
   * Enviar ajuste
   */
  submitAdjustment(): void {
    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.loyaltyAdminService
      .adjustPoints({
        ...this.formData,
        referenceId: this.formData.referenceId || undefined,
      })
      .subscribe({
        next: (response: AdjustPointsResponse) => {
          this.successMessage.set(
            `Ajuste realizado exitosamente. Balance anterior: ${response.previousBalance}, Nuevo balance: ${response.newBalance}`
          );
          this.resetForm();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error ajustando puntos:', err);
          this.errorMessage.set(
            'No se pudo realizar el ajuste. Verifica los datos e intenta nuevamente.'
          );
          this.isSubmitting.set(false);
        },
      });
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.formData = {
      userId: '',
      points: 0,
      reason: '',
      referenceId: '',
    };
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
