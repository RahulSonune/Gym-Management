import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { MemberService } from '../../../core/services/member.service';
import { Member } from '../../../core/models';
import { AsyncPipe } from '@angular/common';

import { memberDisplayName } from '../../../core/utils/member-pii-crypto.util';
import { MemberLabelPipe } from '../../pipes/member-label.pipe';
import { PiiDisplayPipe } from '../../pipes/pii-display.pipe';

@Component({
  selector: 'app-member-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    AsyncPipe,
    MemberLabelPipe,
    PiiDisplayPipe,
  ],
  templateUrl: './member-search.component.html',
  styleUrl: './member-search.component.css',
})
export class MemberSearchComponent {
  @Output() memberSelected = new EventEmitter<Member>();

  private readonly memberService = inject(MemberService);
  readonly searchControl = new FormControl('');

  readonly members$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => {
      const query = typeof q === 'string' ? q : '';
      if (!query || query.length < 2) return of([]);
      return this.memberService.lookup(query);
    })
  );

  onSelect(member: Member): void {
    this.memberSelected.emit(member);
    this.searchControl.setValue(memberDisplayName(member), { emitEvent: false });
  }
}
