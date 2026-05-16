import { Pipe, PipeTransform } from '@angular/core';
import { displayMemberLabel } from '../../core/utils/member-pii-crypto.util';

@Pipe({ name: 'memberLabel', standalone: true })
export class MemberLabelPipe implements PipeTransform {
  transform(
    row:
      | {
          memberName?: string;
          firstName?: string;
          lastName?: string;
          fullName?: string;
        }
      | null
      | undefined
  ): string {
    if (!row) return '-';
    return displayMemberLabel(row);
  }
}
