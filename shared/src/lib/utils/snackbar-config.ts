import { MatSnackBarConfig } from '@angular/material/snack-bar';

const EXTRA_DURATION_MS = 2000;
export const GENERIC_API_ERROR_MESSAGE =
  'Ocurrio un error, por favor contacte a su administrador.';

const SUCCESS_PATTERNS = [
  /exitos/i,
  /cread/i,
  /actualizad/i,
  /eliminad/i,
  /aprobad/i,
  /guardad/i,
  /marcad/i,
  /destacad/i,
  /quitado de destacados/i,
];

const ERROR_PATTERNS = [
  /error/i,
  /no se pudo/i,
  /no puedes/i,
  /inv[aá]lid/i,
  /debe/i,
  /requerid/i,
  /supera/i,
  /m[aá]ximo/i,
  /selecciona/i,
  /omit(i[oó]|ieron)/i,
  /fall/i,
];

type SnackTone = 'success' | 'error' | 'warning';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractValidationMessage(errors: unknown): string | null {
  if (!isRecord(errors)) {
    return null;
  }

  for (const field of Object.keys(errors)) {
    const value = errors[field];

    if (Array.isArray(value)) {
      for (const item of value) {
        const message = toNonEmptyString(item);
        if (message) {
          return message;
        }
      }
      continue;
    }

    const message = toNonEmptyString(value);
    if (message) {
      return message;
    }
  }

  return null;
}

function getErrorPayload(error: unknown): Record<string, unknown> | null {
  if (!isRecord(error)) {
    return null;
  }

  const nestedError = error['error'];
  if (isRecord(nestedError)) {
    return nestedError;
  }

  return error;
}

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage = GENERIC_API_ERROR_MESSAGE
): string {
  const payload = getErrorPayload(error);

  if (!payload) {
    return fallbackMessage;
  }

  const detail = toNonEmptyString(payload['detail']);
  if (detail) {
    return detail;
  }

  const validationMessage = extractValidationMessage(payload['errors']);
  if (validationMessage) {
    return validationMessage;
  }

  const title = toNonEmptyString(payload['title']);
  if (title) {
    return title;
  }

  const message = toNonEmptyString(payload['message']);
  if (message) {
    return message;
  }

  const description = toNonEmptyString(payload['error_description']);
  if (description) {
    return description;
  }

  return fallbackMessage;
}

function normalizePanelClass(
  panelClass?: MatSnackBarConfig['panelClass']
): string[] {
  if (!panelClass) {
    return [];
  }

  return Array.isArray(panelClass) ? panelClass : [panelClass];
}

function resolveSnackTone(message: string): SnackTone {
  if (ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return 'error';
  }

  if (SUCCESS_PATTERNS.some((pattern) => pattern.test(message))) {
    return 'success';
  }

  return 'warning';
}

export function buildAppSnackBarConfig(
  message: string,
  config?: MatSnackBarConfig
): MatSnackBarConfig {
  const inputConfig = config ?? {};
  const tone = resolveSnackTone(message);
  const existingPanelClasses = normalizePanelClass(
    inputConfig.panelClass
  ).filter(
    (className) =>
      className !== 'app-snackbar' && !className.startsWith('app-snackbar-')
  );

  const baseDuration = inputConfig.duration ?? 3000;

  return {
    ...inputConfig,
    duration: baseDuration + EXTRA_DURATION_MS,
    verticalPosition: 'top',
    horizontalPosition: 'end',
    panelClass: [
      'app-snackbar',
      `app-snackbar-${tone}`,
      ...existingPanelClasses,
    ],
  };
}
