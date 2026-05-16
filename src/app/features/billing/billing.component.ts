import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BillingService } from '../../core/services/billing.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { Invoice, Payment } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyMinorPipe } from '../../shared/pipes/currency-minor.pipe';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    StatusBadgeComponent,
    CurrencyMinorPipe,
    MemberLabelPipe,
  ],
  templateUrl: './billing.component.html',
})
export class BillingComponent implements OnInit {
  private readonly billingService = inject(BillingService);
  private readonly branchContext = inject(BranchContextService);

  readonly invoices = signal<Invoice[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly invCols = ['number', 'member', 'total', 'status'];
  readonly payCols = ['number', 'member', 'amount', 'method', 'status'];

  ngOnInit(): void {
    const branchId = this.branchContext.selectedBranchId() ?? undefined;
    this.billingService.listInvoices(branchId).subscribe((i) => this.invoices.set(i));
    this.billingService.listPayments(branchId).subscribe((p) => this.payments.set(p));
  }
}
