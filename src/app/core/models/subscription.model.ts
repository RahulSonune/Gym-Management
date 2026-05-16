import { SubscriptionStatus } from './common.model';

export interface SubscriptionSummary {
  id: number;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  daysRemaining?: number;
}

export interface Subscription extends SubscriptionSummary {
  memberId: number;
  branchId: number;
  planId: number;
  autoRenew: boolean;
  freezeStartDate?: string;
  freezeEndDate?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface SellSubscriptionRequest {
  memberId: number;
  branchId: number;
  planId: number;
  startDate: string;
  autoRenew: boolean;
  payment: {
    amountMinor: number;
    method: string;
    idempotencyKey: string;
  };
  couponCode?: string;
}
