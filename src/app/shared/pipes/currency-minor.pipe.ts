import { Pipe, PipeTransform } from '@angular/core';
import { formatMinorAmount } from '../../core/utils/money.util';

@Pipe({ name: 'currencyMinor', standalone: true })
export class CurrencyMinorPipe implements PipeTransform {
  transform(amountMinor: number | null | undefined, currency = 'INR'): string {
    if (amountMinor == null) return '-';
    return formatMinorAmount(amountMinor, currency);
  }
}
