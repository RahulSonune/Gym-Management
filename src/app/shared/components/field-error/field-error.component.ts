import { Component, input, computed } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  controlShowError,
  getControlErrorMessage,
} from '../../../core/utils/form-validation.util';

/**
 * Renders a Material mat-error only when this control is invalid.
 * (A permanent mat-error host would mark the whole mat-form-field as errored.)
 */
@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [MatFormFieldModule],
  template: `
    @if (showError()) {
      <mat-error role="alert">{{ errorMessage() }}</mat-error>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  readonly label = input.required<string>();
  /** After submit: show this field's error even if it was not blurred yet. */
  readonly forceShow = input(false);

  readonly showError = computed(() => {
    const c = this.control();
    if (!c?.errors) {
      return false;
    }
    return controlShowError(c) || (this.forceShow() && !!c.errors);
  });

  readonly errorMessage = computed(() =>
    getControlErrorMessage(this.control(), this.label()) ?? ''
  );
}
