import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PlanService } from '../../core/services/plan.service';
import { MembershipPlan } from '../../core/models';
import { CurrencyMinorPipe } from '../../shared/pipes/currency-minor.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [MatTableModule, CurrencyMinorPipe, StatusBadgeComponent],
  templateUrl: './plans-list.component.html',
})
export class PlansListComponent implements OnInit {
  private readonly planService = inject(PlanService);
  readonly plans = signal<MembershipPlan[]>([]);
  readonly columns = ['code', 'name', 'duration', 'price', 'features', 'status'];

  ngOnInit(): void {
    this.planService.list(false).subscribe((p) => this.plans.set(p));
  }
}
