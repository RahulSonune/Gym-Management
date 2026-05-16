import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BillingService } from '../services/billing.service';
import { Payment } from '../models';
import { environment } from '../../../environments/environment';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay.util';

export interface RazorpayMemberCheckoutParams {
  memberId: number;
  branchId: number;
  amountMinor: number;
  notes?: string;
  /** Shown in Razorpay modal subtitle */
  description?: string;
}

/**
 * Creates a Razorpay order, opens Checkout, verifies payment on the server.
 */
@Injectable({ providedIn: 'root' })
export class RazorpayCheckoutService {
  private readonly billing = inject(BillingService);

  runMemberCheckout(params: RazorpayMemberCheckoutParams): Observable<Payment> {
    const description = params.description ?? 'Member payment';
    return this.billing
      .createRazorpayOrder({
        memberId: params.memberId,
        branchId: params.branchId,
        amountMinor: params.amountMinor,
        notes: params.notes,
      })
      .pipe(
        switchMap((order) =>
          from(loadRazorpayScript()).pipe(
            switchMap(
              () =>
                new Observable<Payment>((subscriber) => {
                  let settled = false;

                  const finishError = (msg: string) => {
                    if (settled) return;
                    settled = true;
                    subscriber.error(new Error(msg));
                  };

                  try {
                    openRazorpayCheckout({
                      key: order.keyId,
                      amount: order.amount,
                      currency: order.currency,
                      name: environment.appName,
                      description,
                      order_id: order.orderId,
                      handler: (response) => {
                        if (settled) return;
                        const idem =
                          typeof crypto !== 'undefined' && 'randomUUID' in crypto
                            ? `rzp-${crypto.randomUUID()}`
                            : `rzp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                        this.billing
                          .confirmRazorpayPayment({
                            memberId: params.memberId,
                            branchId: params.branchId,
                            amountMinor: params.amountMinor,
                            notes: params.notes,
                            idempotencyKey: idem,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                          })
                          .subscribe({
                            next: (p) => {
                              if (settled) return;
                              settled = true;
                              subscriber.next(p);
                              subscriber.complete();
                            },
                            error: () => {
                              finishError('Could not verify payment with the server.');
                            },
                          });
                      },
                      theme: { color: '#1976d2' },
                      modal: {
                        ondismiss: () => {
                          if (settled) return;
                          finishError('Payment cancelled');
                        },
                      },
                    });
                  } catch (e) {
                    finishError(
                      e instanceof Error ? e.message : 'Could not start Razorpay Checkout.'
                    );
                  }
                })
            )
          )
        )
      );
  }
}
