import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MemberService } from '../../core/services/member.service';
import { BillingService } from '../../core/services/billing.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { AttendanceLog, MemberProfile, Payment } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyMinorPipe } from '../../shared/pipes/currency-minor.pipe';
import { EmptyPlaceholderPipe } from '../../shared/pipes/empty-placeholder.pipe';
import { formatDateTime } from '../../core/utils/date.util';
import { displayPiiField, memberDisplayName } from '../../core/utils/member-pii-crypto.util';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    CurrencyMinorPipe,
    EmptyPlaceholderPipe,
    PiiDisplayPipe,
  ],
  templateUrl: './member-detail.component.html',
  styleUrl: './member-detail.component.css',
})
export class MemberDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly memberService = inject(MemberService);
  private readonly billingService = inject(BillingService);
  private readonly attendanceService = inject(AttendanceService);

  readonly member = signal<MemberProfile | null>(null);
  readonly payments = signal<Payment[]>([]);
  readonly attendance = signal<AttendanceLog[]>([]);
  readonly detailLoading = signal(true);
  readonly payCols = ['number', 'amount', 'method', 'status'];
  readonly attCols = ['checkIn', 'checkOut', 'method'];
  readonly formatDt = formatDateTime;
  readonly displayName = memberDisplayName;

  formatEmergencyContact(m: MemberProfile): string {
    const name = displayPiiField(m.emergencyContactName, '');
    const phone = displayPiiField(m.emergencyContactPhone, '');
    if (!name && !phone) return '-';
    if (name && phone) return `${name} (${phone})`;
    return name || phone;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.memberService.getById(id).subscribe({
      next: (m) => {
        this.member.set(m);
        this.detailLoading.set(false);
      },
      error: () => {
        this.member.set(null);
        this.detailLoading.set(false);
      },
    });
    this.billingService.listPayments().subscribe((all) =>
      this.payments.set(all.filter((p) => p.memberId === id))
    );
    this.attendanceService.list(1).subscribe((all) =>
      this.attendance.set(all.filter((a) => a.memberId === id))
    );
  }
}
