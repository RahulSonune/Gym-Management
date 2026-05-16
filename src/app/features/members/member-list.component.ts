import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MemberService } from '../../core/services/member.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { Member } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyPlaceholderPipe } from '../../shared/pipes/empty-placeholder.pipe';
import { memberDisplayName } from '../../core/utils/member-pii-crypto.util';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    StatusBadgeComponent,
    EmptyPlaceholderPipe,
    PiiDisplayPipe,
  ],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.css',

})
export class MemberListComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly branchContext = inject(BranchContextService);

  readonly members = signal<Member[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly columns = ['code', 'name', 'phone', 'status', 'branch', 'actions'];
  readonly search = new FormControl('');
  readonly status = new FormControl('');

  ngOnInit(): void {
    this.load();
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.load());
    this.status.valueChanges.subscribe(() => this.load());
  }

  readonly displayName = memberDisplayName;

  private load(): void {
    const branchId = this.branchContext.selectedBranchId() ?? undefined;
    const searchRaw = this.search.value?.trim();
    this.loadError.set(null);
    this.memberService
      .list({
        branchId,
        search: searchRaw || undefined,
        status: this.status.value || undefined,
      })
      .subscribe({
        next: (page) => this.members.set(page.content ?? []),
        error: (err) => {
          console.error('[MemberList] load failed', err);
          this.members.set([]);
          this.loadError.set('Could not load members. Check login and API connection.');
        },
      });
  }
}
