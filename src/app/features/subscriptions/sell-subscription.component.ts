import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MemberSearchComponent } from '../../shared/components/member-search/member-search.component';
import { PlanService } from '../../core/services/plan.service';
import { MemberService } from '../../core/services/member.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { BillingService } from '../../core/services/billing.service';
import { RazorpayCheckoutService } from '../../core/services/razorpay-checkout.service';
import { Member, MembershipPlan } from '../../core/models';
import { CurrencyMinorPipe } from '../../shared/pipes/currency-minor.pipe';
import { MemberLabelPipe } from '../../shared/pipes/member-label.pipe';
import { environment } from '../../../environments/environment';
import { delay, of } from 'rxjs';
import { markFormGroupTouched } from '../../core/utils/form-validation.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-sell-subscription',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatStepperModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MemberSearchComponent,
    CurrencyMinorPipe,
    MemberLabelPipe,
    FieldErrorComponent,
  ],
  templateUrl: './sell-subscription.component.html',
  styleUrl: './sell-subscription.component.css',
})
export class SellSubscriptionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly planService = inject(PlanService);
  private readonly memberService = inject(MemberService);
  private readonly branchContext = inject(BranchContextService);
  private readonly billingService = inject(BillingService);
  private readonly razorpayCheckout = inject(RazorpayCheckoutService);
  private readonly route = inject(ActivatedRoute);

  readonly member = signal<Member | null>(null);
  readonly plans = signal<MembershipPlan[]>([]);
  readonly saving = signal(false);
  readonly razorpayLoading = signal(false);
  readonly done = signal(false);
  readonly razorpayEnabled = signal(false);
  /** False until GET /payments/razorpay/config returns (live API only). */
  readonly razorpayConfigResolved = signal(environment.useMockApi);
  readonly paymentError = signal<string | null>(null);
  readonly memberRequiredError = signal<string | null>(null);
  readonly useMockApi = environment.useMockApi;

  /** Disable UPI until config is known, or when mock API / Razorpay off server-side. */
  readonly upiMethodDisabled = computed(
    () => environment.useMockApi || !this.razorpayConfigResolved() || !this.razorpayEnabled()
  );
  readonly memberStep = this.fb.group({});
  readonly planStep = this.fb.group({
    planId: [null as number | null, Validators.required],
    startDate: [new Date().toISOString().slice(0, 10), Validators.required],
  });
  readonly paymentStep = this.fb.nonNullable.group({
    amountMajor: [0, [Validators.required, Validators.min(1)]],
    method: ['CASH' as 'CASH' | 'UPI' | 'CARD', Validators.required],
  });

  ngOnInit(): void {
    this.planService.list().subscribe((p) => this.plans.set(p));
    const memberId = this.route.snapshot.queryParamMap.get('memberId');
    if (memberId) {
      this.memberService.getById(+memberId).subscribe((m) => this.member.set(m));
    }
    if (!environment.useMockApi) {
      this.billingService.getRazorpayConfig().subscribe({
        next: (c) => {
          const ok = c.enabled && !!c.keyId?.trim();
          this.razorpayEnabled.set(ok);
          this.razorpayConfigResolved.set(true);
          if (!ok && this.paymentStep.get('method')?.value === 'UPI') {
            this.paymentStep.patchValue({ method: 'CASH' });
          }
        },
        error: () => {
          this.razorpayEnabled.set(false);
          this.razorpayConfigResolved.set(true);
          if (this.paymentStep.get('method')?.value === 'UPI') {
            this.paymentStep.patchValue({ method: 'CASH' });
          }
        },
      });
    }
  }

  onMember(m: Member): void {
    this.memberRequiredError.set(null);
    this.member.set(m);
  }

  goToPlanStep(stepper: MatStepper): void {
    if (!this.member()) {
      this.memberRequiredError.set('Please select a member.');
      return;
    }
    this.memberRequiredError.set(null);
    stepper.next();
  }

  goToPaymentStep(stepper: MatStepper): void {
    if (this.planStep.invalid) {
      markFormGroupTouched(this.planStep);
      return;
    }
    stepper.next();
  }

  complete(): void {
    if (this.done() || this.saving() || this.razorpayLoading()) return;
    const m = this.member();
    if (!m) {
      this.memberRequiredError.set('Please select a member.');
      return;
    }
    if (this.planStep.invalid) {
      markFormGroupTouched(this.planStep);
      return;
    }
    if (this.paymentStep.invalid) {
      markFormGroupTouched(this.paymentStep);
      return;
    }

    const pay = this.paymentStep.getRawValue();
    const planVals = this.planStep.getRawValue();
    const amountMinor = Math.round(pay.amountMajor * 100);
    const saleNotes = `Membership sale planId=${planVals.planId} start=${planVals.startDate}`;

    this.paymentError.set(null);

    if (pay.method === 'UPI') {
      if (environment.useMockApi) {
        this.paymentError.set(
          'Razorpay is not available with the mock API. Set useMockApi to false or choose Cash/Card.'
        );
        return;
      }
      if (!this.razorpayEnabled()) {
        this.paymentError.set(
          'Razorpay is not enabled on the server. Configure keys in application.yml or pay with Cash/Card.'
        );
        return;
      }

      this.razorpayLoading.set(true);
      this.razorpayCheckout
        .runMemberCheckout({
          memberId: m.id,
          branchId: this.branchContext.selectedBranchId() ?? 1,
          amountMinor,
          notes: saleNotes,
          description: 'Membership payment',
        })
        .subscribe({
          next: () => {
            this.razorpayLoading.set(false);
            this.done.set(true);
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
      return;
    }

    // Cash / Card — offline recording (existing stub until subscription API exists)
    this.saving.set(true);
    of(true)
      .pipe(delay(600))
      .subscribe(() => {
        this.saving.set(false);
        this.done.set(true);
      });
  }
}
