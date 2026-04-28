import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL_CHARACTER = /[^A-Za-z0-9]/;

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';

    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (value.length < AUTH_PASSWORD_MIN_LENGTH) {
      errors['minlength'] = {
        requiredLength: AUTH_PASSWORD_MIN_LENGTH,
        actualLength: value.length,
      };
    }

    if (value.length > AUTH_PASSWORD_MAX_LENGTH) {
      errors['maxlength'] = {
        requiredLength: AUTH_PASSWORD_MAX_LENGTH,
        actualLength: value.length,
      };
    }

    if (!HAS_UPPERCASE.test(value)) {
      errors['passwordUppercase'] = true;
    }

    if (!HAS_LOWERCASE.test(value)) {
      errors['passwordLowercase'] = true;
    }

    if (!HAS_DIGIT.test(value)) {
      errors['passwordDigit'] = true;
    }

    if (!HAS_SPECIAL_CHARACTER.test(value)) {
      errors['passwordSpecialCharacter'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function passwordMatchValidator(
  passwordField = 'password',
  confirmPasswordField = 'confirmPassword'
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField)?.value;
    const confirmPassword = control.get(confirmPasswordField)?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

export function shouldShowControlError(
  control: AbstractControl | null,
  submitted: boolean
): boolean {
  return (
    !!control &&
    control.invalid &&
    (submitted || control.touched || control.dirty)
  );
}

export function getPasswordErrorMessage(
  control: AbstractControl | null
): string | null {
  if (!control?.errors) {
    return null;
  }

  if (control.hasError('required')) {
    return 'La contraseña es requerida.';
  }

  if (control.hasError('minlength') || control.hasError('maxlength')) {
    return `La contraseña debe tener entre ${AUTH_PASSWORD_MIN_LENGTH} y ${AUTH_PASSWORD_MAX_LENGTH} caracteres.`;
  }

  if (control.hasError('passwordUppercase')) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }

  if (control.hasError('passwordLowercase')) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }

  if (control.hasError('passwordDigit')) {
    return 'La contraseña debe incluir al menos un número.';
  }

  if (control.hasError('passwordSpecialCharacter')) {
    return 'La contraseña debe incluir al menos un carácter especial.';
  }

  return null;
}
