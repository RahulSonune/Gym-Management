import { InvoiceStatus, PaymentMethod, PaymentStatus } from './common.model';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  memberId: number;
  memberName?: string;
  branchId: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  currencyCode: string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  memberId: number;
  memberName?: string;
  branchId: number;
  amountMinor: number;
  currencyCode: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  notes?: string;
}

export interface RecordPaymentRequest {
  memberId: number;
  branchId: number;
  amountMinor: number;
  method: PaymentMethod;
  invoiceId?: number;
  notes?: string;
  idempotencyKey: string;
}

export interface RazorpayConfig {
  enabled: boolean;
  keyId: string | null;
}

export interface CreateRazorpayOrderResponse {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface CreateRazorpayOrderRequest {
  memberId: number;
  branchId: number;
  amountMinor: number;
  notes?: string;
}

export interface ConfirmRazorpayPaymentRequest {
  memberId: number;
  branchId: number;
  amountMinor: number;
  notes?: string;
  idempotencyKey: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
