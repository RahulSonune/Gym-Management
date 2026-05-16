import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { DashboardService } from '../../core/services/dashboard.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { ExpiringMember } from '../../core/models';
import { RouterLink } from '@angular/router';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatTableModule, RouterLink, MemberLabelPipe, PiiDisplayPipe],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly branchContext = inject(BranchContextService);
  readonly expiring = signal<ExpiringMember[]>([]);
  readonly cols = ['member', 'phone', 'plan', 'end', 'days'];

  ngOnInit(): void {
    const branchId = this.branchContext.selectedBranchId() ?? 1;
    this.dashboardService.getExpiring(branchId, 30).subscribe((e) => this.expiring.set(e));
  }
}
