export interface MembershipPlan {
  id: number;
  code: string;
  name: string;
  description?: string;
  durationDays: number;
  priceAmountMinor: number;
  currencyCode: string;
  taxPercent?: number;
  maxFreezeDays: number;
  allowsPt: boolean;
  allowsClasses: boolean;
  branchId?: number;
  isActive: boolean;
}
