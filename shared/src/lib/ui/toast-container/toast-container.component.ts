import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

/**
 * 🍞 Componente de Contenedor de Toasts
 *
 * Muestra las notificaciones toast en la esquina superior derecha
 */
@Component({
  selector: 'lib-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
      <div
        class="toast toast-{{ toast.type }}"
        role="alert"
        tabindex="0"
        (click)="removeToast(toast.id)"
        (keydown.enter)="removeToast(toast.id)"
        (keydown.space)="removeToast(toast.id)"
      >
        @if (toast.icon) {
        <span class="toast-icon">{{ toast.icon }}</span>
        }
        <span class="toast-message">{{ toast.message }}</span>
        <button
          class="toast-close"
          (click)="removeToast(toast.id)"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
        animation: slideIn 0.3s ease-out;
        border-left: 4px solid;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .toast:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        transform: translateY(-2px);
      }

      .toast-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .toast-message {
        flex: 1;
        font-size: 0.95rem;
        line-height: 1.4;
        color: #333;
      }

      .toast-close {
        background: none;
        border: none;
        color: #999;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        transition: color 0.2s;
        flex-shrink: 0;
      }

      .toast-close:hover {
        color: #333;
      }

      /* Toast Types */
      .toast-success {
        border-left-color: #28a745;
      }

      .toast-success .toast-icon {
        background: #28a745;
        color: white;
      }

      .toast-error {
        border-left-color: #dc3545;
      }

      .toast-error .toast-icon {
        background: #dc3545;
        color: white;
      }

      .toast-info {
        border-left-color: #17a2b8;
      }

      .toast-info .toast-icon {
        background: #17a2b8;
        color: white;
      }

      .toast-warning {
        border-left-color: #ffc107;
      }

      .toast-warning .toast-icon {
        background: #ffc107;
        color: #333;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .toast {
          padding: 12px;
        }

        .toast-icon {
          font-size: 1.2rem;
          width: 24px;
          height: 24px;
        }

        .toast-message {
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.activeToasts;

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
