import { Pipe, PipeTransform } from '@angular/core';

/** Renders a single hyphen when value is null, undefined, blank, or NaN. */
@Pipe({ name: 'emptyPlaceholder', standalone: true })
export class EmptyPlaceholderPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number' && Number.isNaN(value)) return '-';
    if (typeof value === 'string' && value.trim() === '') return '-';
    return String(value);
  }
}
