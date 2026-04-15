import { Injectable, signal } from '@angular/core';

/**
 * 🍞 Tipos de Toast
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * 📬 Interface de Toast
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  icon?: string;
}

/**
 * 🍞 Servicio de Notificaciones Toast
 *
 * Servicio simple y reactivo para mostrar notificaciones temporales
 * usando Angular Signals
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly extraDurationMs = 2000;
  private readonly toasts = signal<Toast[]>([]);
  private idCounter = 0;

  // Signal público de solo lectura
  readonly activeToasts = this.toasts.asReadonly();

  /**
   * Muestra un toast de éxito
   */
  success(message: string, duration = 3000): void {
    this.show({
      message,
      type: 'success',
      duration,
      icon: '✓',
    });
  }

  /**
   * Muestra un toast de error
   */
  error(message: string, duration = 4000): void {
    this.show({
      message,
      type: 'error',
      duration,
      icon: '✕',
    });
  }

  /**
   * Muestra un toast de información
   */
  info(message: string, duration = 3000): void {
    this.show({
      message,
      type: 'info',
      duration,
      icon: 'ℹ',
    });
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(message: string, duration = 3500): void {
    this.show({
      message,
      type: 'warning',
      duration,
      icon: '⚠',
    });
  }

  /**
   * Muestra un toast personalizado
   */
  private show(toast: Omit<Toast, 'id'>): void {
    const id = `toast-${++this.idCounter}`;
    const newToast: Toast = { id, ...toast };

    // Agregar toast a la lista
    this.toasts.update((toasts) => [...toasts, newToast]);

    // Auto-remover después de la duración
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration + this.extraDurationMs);
    }
  }

  /**
   * Remueve un toast específico
   */
  remove(id: string): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /**
   * Remueve todos los toasts
   */
  clear(): void {
    this.toasts.set([]);
  }
}
