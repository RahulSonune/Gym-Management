import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AttendanceService } from '../../core/services/attendance.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { AttendanceLog, LiveAttendance } from '../../core/models';
import { formatDateTime } from '../../core/utils/date.util';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';
import { EmptyPlaceholderPipe } from '../../shared/pipes/empty-placeholder.pipe';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MemberLabelPipe,
    PiiDisplayPipe,
    EmptyPlaceholderPipe,
  ],
  templateUrl: './attendance-list.component.html',
})
export class AttendanceListComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly branchContext = inject(BranchContextService);

  readonly logs = signal<AttendanceLog[]>([]);
  readonly live = signal<LiveAttendance[]>([]);
  readonly checkingOutId = signal<number | null>(null);
  readonly logCols = ['member', 'code', 'checkIn', 'checkOut', 'method'];
  readonly liveCols = ['name', 'plan', 'time', 'actions'];
  readonly formatDt = formatDateTime;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const branchId = this.branchContext.selectedBranchId() ?? 1;
    this.attendanceService.list(branchId).subscribe((l) => this.logs.set(l));
    this.attendanceService.live(branchId).subscribe((l) => this.live.set(l));
  }

  checkOut(row: LiveAttendance): void {
    const branchId = this.branchContext.selectedBranchId() ?? 1;
    this.checkingOutId.set(row.memberId);
    this.attendanceService
      .checkOut({ memberId: row.memberId, branchId, method: 'MANUAL' })
      .subscribe({
        next: () => {
          this.checkingOutId.set(null);
          this.reload();
        },
        error: () => this.checkingOutId.set(null),
      });
  }
}
