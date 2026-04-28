import { InjectionToken } from '@angular/core';

export interface AppError {
  status?: number;
  code: string;
  message: string;
  userMessage: string;
  correlationId?: string;
  details?: unknown;
}

export type HttpErrorNotifier = (error: AppError) => void;

export const DEFAULT_APP_ERROR_USER_MESSAGE =
  'Estamos presentando fallas para procesar tu solicitud. Inténtalo nuevamente más tarde.';

export const HTTP_ERROR_NOTIFIER = new InjectionToken<HttpErrorNotifier>(
  'HTTP_ERROR_NOTIFIER'
);
