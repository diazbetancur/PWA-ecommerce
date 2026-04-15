import { MatSnackBarConfig } from '@angular/material/snack-bar';

const EXTRA_DURATION_MS = 2000;

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
