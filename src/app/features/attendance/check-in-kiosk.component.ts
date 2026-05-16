import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MemberSearchComponent } from '../../shared/components/member-search/member-search.component';
import { AttendanceService } from '../../core/services/attendance.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { CheckInResponse, CheckOutResponse, Member } from '../../core/models';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';
import { formatDateTime } from '../../core/utils/date.util';

export type KioskMode = 'check-in' | 'check-out';

@Component({
  selector: 'app-check-in-kiosk',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MemberSearchComponent,
    MemberLabelPipe,
    PiiDisplayPipe,
    MatButtonToggleModule,
  ],
  templateUrl: './check-in-kiosk.component.html',
  styleUrl: './check-in-kiosk.component.css',

})
export class CheckInKioskComponent {
  private readonly attendanceService = inject(AttendanceService);
  private readonly branchContext = inject(BranchContextService);

  readonly mode = signal<KioskMode>('check-in');
  readonly checkInResult = signal<CheckInResponse | null>(null);
  readonly checkOutResult = signal<CheckOutResponse | null>(null);
  readonly loading = signal(false);
  readonly formatDt = formatDateTime;

  setMode(mode: KioskMode | string): void {
    if (mode !== 'check-in' && mode !== 'check-out') return;
    this.mode.set(mode);
    this.checkInResult.set(null);
    this.checkOutResult.set(null);
  }

  onMemberSelected(member: Member): void {
    this.loading.set(true);
    this.checkInResult.set(null);
    this.checkOutResult.set(null);
    const branchId = this.branchContext.selectedBranchId() ?? 1;
    const request = { memberId: member.id, branchId, method: 'MANUAL' as const };

    if (this.mode() === 'check-out') {
      this.attendanceService.checkOut(request).subscribe({
        next: (r) => {
          this.loading.set(false);
          this.checkOutResult.set(r);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    this.attendanceService.checkIn(request).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.checkInResult.set(r);
      },
      error: () => this.loading.set(false),
    });
  }
}
