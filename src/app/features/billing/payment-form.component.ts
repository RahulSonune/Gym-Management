import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MemberSearchComponent } from '../../shared/components/member-search/member-search.component';
import { BillingService } from '../../core/services/billing.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { Member, PaymentMethod } from '../../core/models';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';
import { environment } from '../../../environments/environment';
import { RazorpayCheckoutService } from '../../core/services/razorpay-checkout.service';
import { markFormGroupTouched } from '../../core/utils/form-validation.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MemberSearchComponent,
    MemberLabelPipe,
    FieldErrorComponent,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
})
export class PaymentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly billingService = inject(BillingService);
  private readonly branchContext = inject(BranchContextService);
  private readonly router = inject(Router);
  private readonly razorpayCheckout = inject(RazorpayCheckoutService);

  readonly selectedMember = signal<Member | null>(null);
  readonly saving = signal(false);
  readonly razorpayEnabled = signal(false);
  readonly razorpayLoading = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly memberRequiredError = signal<string | null>(null);
  readonly useMockApi = environment.useMockApi;

  readonly form = this.fb.nonNullable.group({
    amountMajor: [0, [Validators.required, Validators.min(1)]],
    method: ['CASH' as PaymentMethod, Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    if (environment.useMockApi) {
      return;
    }
    this.billingService.getRazorpayConfig().subscribe({
      next: (c) => this.razorpayEnabled.set(c.enabled && !!c.keyId?.trim()),
      error: () => this.razorpayEnabled.set(false),
    });
  }

  onMemberSelected(member: Member): void {
    this.memberRequiredError.set(null);
    this.selectedMember.set(member);
  }

  onSubmit(): void {
    if (this.saving() || this.razorpayLoading()) return;
    const member = this.selectedMember();
    if (!member) {
      this.memberRequiredError.set('Please select a member.');
      return;
    }
    if (this.form.invalid) {
      markFormGroupTouched(this.form);
      return;
    }
    this.paymentError.set(null);
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.billingService
      .recordPayment({
        memberId: member.id,
        branchId: this.branchContext.selectedBranchId() ?? 1,
        amountMinor: Math.round(v.amountMajor * 100),
        method: v.method,
        notes: v.notes,
        idempotencyKey: `pay-${Date.now()}`,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/billing']);
        },
        error: () => {
          this.saving.set(false);
          this.paymentError.set('Could not save payment. Try again.');
        },
      });
  }

  payWithRazorpay(): void {
    const member = this.selectedMember();
    const amountCtl = this.form.controls.amountMajor;
    amountCtl.updateValueAndValidity();
    if (!member) {
      this.memberRequiredError.set('Please select a member.');
      return;
    }
    if (amountCtl.invalid || (amountCtl.value ?? 0) < 1) {
      markFormGroupTouched(this.form);
      return;
    }
    this.paymentError.set(null);
    const amountMinor = Math.round((amountCtl.value ?? 0) * 100);
    const branchId = this.branchContext.selectedBranchId() ?? 1;
    const notes = this.form.controls.notes.value?.trim() || undefined;

    this.razorpayLoading.set(true);
    this.razorpayCheckout
      .runMemberCheckout({
        memberId: member.id,
        branchId,
        amountMinor,
        notes,
        description: 'Member payment',
      })
      .subscribe({
        next: () => {
          this.razorpayLoading.set(false);
          this.router.navigate(['/billing']);
        },
        error: (err: unknown) => {
          this.razorpayLoading.set(false);
          if (err instanceof Error && err.message === 'Payment cancelled') {
            return;
          }
          let msg = 'Could not complete payment.';
          if (typeof err === 'object' && err !== null && 'error' in err) {
            const e = err as { error?: { message?: string } };
            if (typeof e.error?.message === 'string') msg = e.error.message;
          } else if (err instanceof Error && err.message) {
            msg = err.message;
          }
          this.paymentError.set(msg);
        },
      });
  }
}
