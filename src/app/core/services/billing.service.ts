import { Injectable, inject } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { MOCK_INVOICES, MOCK_PAYMENTS } from '../data/mock-data';
import {
  ConfirmRazorpayPaymentRequest,
  CreateRazorpayOrderRequest,
  CreateRazorpayOrderResponse,
  Invoice,
  Payment,
  RazorpayConfig,
  RecordPaymentRequest,
} from '../models';
import { sealMemberPiiRequest, unsealMemberPii } from '../utils/member-pii-rx.util';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly api = inject(ApiBaseService);

  listInvoices(branchId?: number): Observable<Invoice[]> {
    if (environment.useMockApi) {
      let items = [...MOCK_INVOICES];
      if (branchId) items = items.filter((i) => i.branchId === branchId);
      return of(items).pipe(delay(200));
    }
    return unsealMemberPii(this.api['get']<Invoice[]>('/invoices', { branchId }));
  }

  listPayments(branchId?: number): Observable<Payment[]> {
    if (environment.useMockApi) {
      let items = [...MOCK_PAYMENTS];
      if (branchId) items = items.filter((p) => p.branchId === branchId);
      return of(items).pipe(delay(200));
    }
    return unsealMemberPii(this.api['get']<Payment[]>('/payments', { branchId }));
  }

  recordPayment(request: RecordPaymentRequest): Observable<Payment> {
    if (environment.useMockApi) {
      return of({
        id: Date.now(),
        paymentNumber: `PAY-B1-2026-${String(MOCK_PAYMENTS.length + 1).padStart(5, '0')}`,
        memberId: request.memberId,
        branchId: request.branchId,
        amountMinor: request.amountMinor,
        currencyCode: 'INR',
        method: request.method,
        status: 'SUCCESS' as const,
        paidAt: new Date().toISOString(),
        notes: request.notes,
      }).pipe(delay(400));
    }
    return sealMemberPiiRequest(request, (body) =>
      this.api['post']<Payment>('/payments', body as never)
    );
  }

  getRazorpayConfig(): Observable<RazorpayConfig> {
    if (environment.useMockApi) {
      return of({ enabled: false, keyId: null });
    }
    return this.api['get']<RazorpayConfig>('/payments/razorpay/config');
  }

  createRazorpayOrder(request: CreateRazorpayOrderRequest): Observable<CreateRazorpayOrderResponse> {
    if (environment.useMockApi) {
      return throwError(
        () => new Error('Razorpay checkout is not available when useMockApi is enabled')
      );
    }
    return sealMemberPiiRequest(request, (body) =>
      this.api['post']<CreateRazorpayOrderResponse>('/payments/razorpay/order', body as never)
    );
  }

  confirmRazorpayPayment(request: ConfirmRazorpayPaymentRequest): Observable<Payment> {
    if (environment.useMockApi) {
      return throwError(
        () => new Error('Razorpay confirm is not available when useMockApi is enabled')
      );
    }
    return sealMemberPiiRequest(request, (body) =>
      this.api['post']<Payment>('/payments/razorpay/confirm', body as never)
    );
  }
}
