import { Pipe, PipeTransform } from '@angular/core';
import { displayPiiField } from '../../core/utils/member-pii-crypto.util';

@Pipe({ name: 'piiDisplay', standalone: true })
export class PiiDisplayPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return displayPiiField(value);
  }
}
