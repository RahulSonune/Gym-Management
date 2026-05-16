export interface DashboardSummary {
  branchId: number;
  date: string;
  activeMembers: number;
  checkInsToday: number;
  currentlyInside: number;
  expiringIn7Days: number;
  overdueInvoices: number;
  revenueTodayMinor: number;
  newMembersToday: number;
}

export interface RevenueReport {
  from: string;
  to: string;
  branchId?: number;
  totalRevenueMinor: number;
  byMethod: { method: string; amountMinor: number }[];
  byDay: { date: string; amountMinor: number }[];
}

export interface ExpiringMember {
  memberId: number;
  memberCode: string;
  fullName: string;
  phone: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
}
