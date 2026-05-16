import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyMinorPipe } from '../../shared/pipes/currency-minor.pipe';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';
import { DashboardService } from '../../core/services/dashboard.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { DashboardSummary, ExpiringMember } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    CurrencyMinorPipe,
    MemberLabelPipe,
    PiiDisplayPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly branchContext = inject(BranchContextService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly expiring = signal<ExpiringMember[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly expiringColumns = ['member', 'plan', 'endDate', 'days'];

  branchName = () => this.branchContext.selectedBranch()?.name ?? 'Branch';

  constructor() {
    effect(() => {
      const branchId = this.branchContext.selectedBranchId() ?? 1;
      this.loadDashboard(branchId);
    });
  }

  retry(): void {
    const branchId = this.branchContext.selectedBranchId() ?? 1;
    this.loadDashboard(branchId);
  }

  private loadDashboard(branchId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.summary.set(null);

    let summaryDone = false;
    let expiringDone = false;

    const finishLoading = () => {
      if (summaryDone && expiringDone) {
        this.loading.set(false);
      }
    };

    this.dashboardService.getSummary(branchId).subscribe({
      next: (s) => {
        this.summary.set(s);
        summaryDone = true;
        finishLoading();
      },
      error: () => {
        this.error.set(this.apiErrorMessage());
        summaryDone = true;
        finishLoading();
      },
    });

    this.dashboardService.getExpiring(branchId).subscribe({
      next: (e) => {
        this.expiring.set(e);
        expiringDone = true;
        finishLoading();
      },
      error: () => {
        if (!this.error()) {
          this.error.set(this.apiErrorMessage());
        }
        this.expiring.set([]);
        expiringDone = true;
        finishLoading();
      },
    });
  }

  private apiErrorMessage(): string {
    if (environment.useMockApi) {
      return 'Could not load dashboard data. Please try again.';
    }
    return (
      'Could not load dashboard data. Start the backend (port 8080), log in again with ' +
      'reception@gym.com / password, or set useMockApi: true in environment.ts for demo data.'
    );
  }
}
