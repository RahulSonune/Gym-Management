import { AbstractControl, FormGroup } from '@angular/forms';

/** Mark every control in the group as touched so mat-errors appear after submit. */
export function markFormGroupTouched(group: FormGroup): void {
  group.markAllAsTouched();
}

/**
 * Short, user-facing message for a single control (Material mat-error).
 * @param fieldLabel Human label, e.g. "First name", "Phone"
 */
export function getControlErrorMessage(
  control: AbstractControl | null | undefined,
  fieldLabel: string
): string | null {
  if (!control?.errors) {
    return null;
  }
  const label = fieldLabel.trim() || 'This field';
  const e = control.errors;

  if (e['required']) {
    return `${label} is required.`;
  }
  if (e['email']) {
    return 'Enter a valid email address.';
  }
  if (e['pattern']) {
    if (/phone|mobile/i.test(label)) {
      return 'Enter a valid 10-digit phone number.';
    }
    return `Enter a valid ${label.toLowerCase()}.`;
  }
  if (e['min'] !== undefined && e['min'] !== null) {
    const min = e['min'] as { min: number };
    if (/amount/i.test(label)) {
      return 'Enter an amount of at least ₹1.';
    }
    return `${label} must be at least ${min.min}.`;
  }
  if (e['max'] !== undefined && e['max'] !== null) {
    const max = e['max'] as { max: number };
    return `${label} must be at most ${max.max}.`;
  }
  if (e['minlength']) {
    const m = e['minlength'] as { requiredLength: number };
    return `${label} must be at least ${m.requiredLength} characters.`;
  }
  if (e['maxlength']) {
    const m = e['maxlength'] as { requiredLength: number };
    return `${label} must be at most ${m.requiredLength} characters.`;
  }

  return `Please check ${label.toLowerCase()}.`;
}

export function controlShowError(control: AbstractControl | null | undefined): boolean {
  return !!control?.errors && (control.touched || control.dirty);
}
