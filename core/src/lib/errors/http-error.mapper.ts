import { HttpErrorResponse } from '@angular/common/http';
import { AppError, DEFAULT_APP_ERROR_USER_MESSAGE } from './app-error';

const REQUEST_CORRELATION_ID_KEY = '__requestCorrelationId';

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

function normalizeErrorCode(value: unknown): string | null {
  const normalizedValue = toNonEmptyString(value);
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function includesAny(value: string, fragments: string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

function extractValidationMessage(errors: unknown): string | null {
  if (!isRecord(errors)) {
    return null;
  }

  for (const value of Object.values(errors)) {
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
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    return error.error;
  }

  if (!isRecord(error)) {
    return null;
  }

  const nestedError = error['error'];
  if (isRecord(nestedError)) {
    return nestedError;
  }

  return error;
}

function getProblemDetailsExtensions(
  payload: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }

  const extensions = payload['extensions'];
  return isRecord(extensions) ? extensions : null;
}

function getCorrelationId(
  error: unknown,
  payload: Record<string, unknown> | null
): string | undefined {
  if (error instanceof HttpErrorResponse) {
    const fromHeaders =
      error.headers.get('X-Correlation-Id') ||
      error.headers.get('x-correlation-id') ||
      error.headers.get('X-Request-Id') ||
      error.headers.get('x-request-id');

    if (fromHeaders) {
      return fromHeaders;
    }
  }

  const extensions = getProblemDetailsExtensions(payload);
  const payloadCandidates = [
    payload?.['correlationId'],
    payload?.['correlationID'],
    payload?.['traceId'],
    extensions?.['correlationId'],
    extensions?.['traceId'],
  ];

  for (const candidate of payloadCandidates) {
    const value = toNonEmptyString(candidate);
    if (value) {
      return value;
    }
  }

  if (isRecord(error)) {
    const requestCorrelationId = toNonEmptyString(
      error[REQUEST_CORRELATION_ID_KEY]
    );
    if (requestCorrelationId) {
      return requestCorrelationId;
    }
  }

  return undefined;
}

function getTechnicalMessage(
  error: unknown,
  payload: Record<string, unknown> | null
): string {
  const candidates = [
    payload?.['detail'],
    extractValidationMessage(payload?.['errors']),
    payload?.['title'],
    payload?.['message'],
    payload?.['error_description'],
    error instanceof Error ? error.message : null,
  ];

  for (const candidate of candidates) {
    const message = toNonEmptyString(candidate);
    if (message) {
      return message;
    }
  }

  return DEFAULT_APP_ERROR_USER_MESSAGE;
}

function isCredentialFailure(
  technicalMessage: string,
  payload: Record<string, unknown> | null
): boolean {
  const combinedMessage = [
    technicalMessage,
    toNonEmptyString(payload?.['title']),
    toNonEmptyString(payload?.['error']),
    toNonEmptyString(payload?.['message']),
  ]
    .filter((value): value is string => !!value)
    .join(' ')
    .toLowerCase();

  return includesAny(combinedMessage, [
    'authentication failed',
    'invalid credentials',
    'invalid email',
    'invalid password',
    'correo o contraseña',
    'credenciales',
  ]);
}

function resolveTenantUnavailableMessage(technicalMessage: string): string {
  const normalizedMessage = technicalMessage.toLowerCase();

  if (
    includesAny(normalizedMessage, [
      'pendingactivation',
      'pending activation',
      'tenant pending activation',
    ])
  ) {
    return 'Este comercio está pendiente de activación. Revisa el correo de activación o usa recuperación de contraseña.';
  }

  return 'Este comercio no está disponible temporalmente.';
}

function resolveMappedUserMessage(
  code: string,
  technicalMessage: string,
  status: number | undefined,
  payload: Record<string, unknown> | null
): string | null {
  switch (code) {
    case 'INVALID_ACTIVATION_TOKEN':
      return 'El enlace de activación no es válido o ya no está disponible.';
    case 'EXPIRED_ACTIVATION_TOKEN':
      return 'El enlace de activación venció. Solicita uno nuevo desde recuperación de contraseña.';
    case 'USED_ACTIVATION_TOKEN':
      return 'Este enlace ya fue utilizado.';
    case 'REVOKED_ACTIVATION_TOKEN':
      return 'Este enlace fue revocado. Solicita uno nuevo.';
    case 'TENANT_NOT_PENDING_ACTIVATION':
      return 'Este comercio no está pendiente de activación.';
    case 'USER_NOT_PENDING_ACTIVATION':
      return 'Esta cuenta no está pendiente de activación.';
    case 'TENANT_SYNC_FAILED':
      return 'No pudimos completar la activación. Intenta nuevamente más tarde.';
    case 'PASSWORD_CONFIRMATION_MISMATCH':
      return 'Las contraseñas no coinciden.';
    case 'PASSWORD_POLICY_NOT_MET':
      return 'La contraseña no cumple con los requisitos de seguridad.';
    case 'INVALID_PASSWORD_RESET_TOKEN':
      return 'El enlace de recuperación no es válido o ya no está disponible.';
    case 'EXPIRED_PASSWORD_RESET_TOKEN':
      return 'El enlace de recuperación venció. Solicita uno nuevo.';
    case 'USED_PASSWORD_RESET_TOKEN':
      return 'Este enlace ya fue utilizado.';
    case 'REVOKED_PASSWORD_RESET_TOKEN':
      return 'Este enlace fue revocado. Solicita uno nuevo.';
    case 'TENANT_REQUIRED':
      return 'No se pudo identificar el comercio.';
    case 'TENANT_MISMATCH':
      return 'El enlace no corresponde a este comercio.';
    case 'USER_NOT_ACTIVE':
      return 'Esta cuenta no está activa.';
    case 'TENANT_NOT_FOUND':
      return 'El comercio no existe o la dirección no es válida.';
    case 'TENANT_NOT_AVAILABLE':
      return resolveTenantUnavailableMessage(technicalMessage);
    case 'UNAUTHORIZED':
      if (status === 401 && isCredentialFailure(technicalMessage, payload)) {
        return 'Correo o contraseña inválidos.';
      }
      return null;
    default:
      return null;
  }
}

function resolveCode(
  status: number | undefined,
  payload: Record<string, unknown> | null
): string {
  const payloadCode = normalizeErrorCode(payload?.['code']);
  if (payloadCode) {
    return payloadCode;
  }

  const payloadError = normalizeErrorCode(payload?.['error']);
  if (payloadError) {
    return payloadError;
  }

  switch (status) {
    case 0:
      return 'NETWORK_ERROR';
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 502:
    case 503:
    case 504:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status ? `HTTP_${status}` : 'UNKNOWN_ERROR';
  }
}

function resolveUserMessage(
  code: string,
  status: number | undefined,
  technicalMessage: string,
  payload: Record<string, unknown> | null
): string {
  const mappedUserMessage = resolveMappedUserMessage(
    code,
    technicalMessage,
    status,
    payload
  );
  if (mappedUserMessage) {
    return mappedUserMessage;
  }

  if (status === 0 || status === 502 || status === 503 || status === 504) {
    return DEFAULT_APP_ERROR_USER_MESSAGE;
  }

  if (status === 401) {
    return 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.';
  }

  if (status === 403) {
    return payload
      ? technicalMessage
      : 'No tienes permisos para realizar esta acción.';
  }

  return technicalMessage || DEFAULT_APP_ERROR_USER_MESSAGE;
}

export function attachRequestCorrelationId(
  error: unknown,
  correlationId: string
): void {
  if (!isRecord(error)) {
    return;
  }

  const currentValue = toNonEmptyString(error[REQUEST_CORRELATION_ID_KEY]);
  if (currentValue) {
    return;
  }

  try {
    Object.defineProperty(error, REQUEST_CORRELATION_ID_KEY, {
      value: correlationId,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  } catch {
    error[REQUEST_CORRELATION_ID_KEY] = correlationId;
  }
}

export function mapErrorToAppError(error: unknown): AppError {
  const payload = getErrorPayload(error);
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  const message = getTechnicalMessage(error, payload);
  const code = resolveCode(status, payload);

  return {
    status,
    code,
    message,
    userMessage: resolveUserMessage(code, status, message, payload),
    correlationId: getCorrelationId(error, payload),
    details:
      payload ??
      (error instanceof Error
        ? {
            name: error.name,
            stack: error.stack,
          }
        : error),
  };
}
