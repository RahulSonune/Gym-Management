import { MemberStatus } from './common.model';
import { BranchSummary } from './branch.model';
import { SubscriptionSummary } from './subscription.model';

export interface Member {
  id: number;
  memberCode: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  status: MemberStatus;
  branchId: number;
  branch?: BranchSummary;
  photoUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  joinedAt?: string;
  source?: string;
  createdAt?: string;
}

export interface MemberProfile extends Member {
  activeSubscription?: SubscriptionSummary;
  stats?: MemberStats;
  addressJson?: Record<string, string>;
}

export interface MemberStats {
  totalVisits: number;
  lastVisitAt?: string;
  outstandingAmountMinor: number;
}

export interface MemberFormData {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  source?: string;
  branchId?: number;
}

export interface MemberNote {
  id: number;
  memberId: number;
  noteText: string;
  isInternal: boolean;
  createdAt: string;
  createdByName?: string;
}
