import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@pwa/shared';
import {
  AdjustPointsRequest,
  AdjustPointsResponse,
} from '../../../models/loyalty.models';
import { TenantUserSummaryDto } from '../../../models/tenant-user.model';
import { LoyaltyAdminService } from '../../../services/loyalty-admin.service';
import { TenantUserService } from '../../../services/tenant-user.service';

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
  templateUrl: './points-adjustment.component.html',
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

      .search-row {
        display: flex;
        gap: 10px;
      }

      .btn-search {
        border: none;
        background: #007bff;
        color: white;
        padding: 0 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-search:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .selected-user-card {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid #b6e0fe;
        background: #f1f8ff;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn-clear-user {
        border: 1px solid #dc3545;
        background: white;
        color: #dc3545;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
      }

      .search-results {
        margin-top: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        max-height: 220px;
        overflow-y: auto;
      }

      .search-result-item {
        width: 100%;
        display: block;
        text-align: left;
        background: white;
        border: none;
        border-bottom: 1px solid #f0f0f0;
        padding: 10px 12px;
        cursor: pointer;
      }

      .search-result-item:hover {
        background: #f8f9fa;
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
  private readonly tenantUserService = inject(TenantUserService);
  private readonly toastService = inject(ToastService);

  // Signals
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isSearchingUser = signal(false);
  customerSearchResults = signal<TenantUserSummaryDto[]>([]);
  selectedCustomer = signal<TenantUserSummaryDto | null>(null);
  userEmailSearch = '';

  // Form data
  formData: AdjustPointsRequest = {
    userId: '',
    points: 0,
    transactionType: 'ADJUST',
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
    if (!this.formData.userId.trim()) {
      this.toastService.warning(
        'Selecciona un usuario por correo o ingresa un ID de usuario válido.'
      );
      return;
    }

    if (!this.isValidUuid(this.formData.userId)) {
      this.toastService.warning(
        'El ID de usuario debe tener formato UUID válido.'
      );
      return;
    }

    if (this.formData.points < -100000 || this.formData.points > 100000) {
      this.toastService.warning(
        'Los puntos deben estar entre -100000 y 100000.'
      );
      return;
    }

    if (this.formData.points === 0) {
      this.toastService.warning('La cantidad de puntos no puede ser 0.');
      return;
    }

    const trimmedReason = this.formData.reason.trim();
    if (trimmedReason.length < 5 || trimmedReason.length > 500) {
      this.toastService.warning(
        'La razón del ajuste debe tener entre 5 y 500 caracteres.'
      );
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const transactionType = this.resolveTransactionType(this.formData.points);

    this.loyaltyAdminService
      .adjustPoints({
        ...this.formData,
        reason: trimmedReason,
        transactionType,
        referenceId: this.formData.referenceId || undefined,
      })
      .subscribe({
        next: (response: AdjustPointsResponse) => {
          this.toastService.success(
            response.message ||
              `Ajuste realizado exitosamente. Nuevo balance: ${response.newBalance}`
          );
          this.resetForm();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.toastService.error(
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
      transactionType: 'ADJUST',
      reason: '',
      referenceId: '',
    };
    this.userEmailSearch = '';
    this.selectedCustomer.set(null);
    this.customerSearchResults.set([]);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  searchCustomerByEmail(): void {
    const email = this.userEmailSearch.trim();

    this.selectedCustomer.set(null);
    this.customerSearchResults.set([]);

    if (!email) {
      this.toastService.warning('Ingresa un correo para buscar clientes.');
      return;
    }

    this.isSearchingUser.set(true);

    this.tenantUserService
      .listCustomers({
        search: email,
        page: 1,
        pageSize: 10,
      })
      .subscribe({
        next: (response) => {
          this.customerSearchResults.set(response.users);

          if (response.users.length === 0) {
            this.toastService.info(
              'No se encontraron clientes con ese correo.'
            );
          }

          this.isSearchingUser.set(false);
        },
        error: (err) => {
          this.toastService.error(
            'No se pudo buscar el cliente. Intenta nuevamente.'
          );
          this.isSearchingUser.set(false);
        },
      });
  }

  selectCustomer(user: TenantUserSummaryDto): void {
    this.selectedCustomer.set(user);
    this.formData.userId = user.id;
    this.userEmailSearch = user.email;
    this.customerSearchResults.set([]);
  }

  clearSelectedCustomer(): void {
    this.selectedCustomer.set(null);
    this.formData.userId = '';
    this.customerSearchResults.set([]);
  }

  onUserIdManualChange(): void {
    if (
      this.selectedCustomer() &&
      this.selectedCustomer()?.id !== this.formData.userId
    ) {
      this.selectedCustomer.set(null);
    }
  }

  private resolveTransactionType(
    _points: number
  ): 'EARN' | 'REDEEM' | 'ADJUST' {
    return 'ADJUST';
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value.trim());
  }
}
