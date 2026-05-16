import { BranchSummary } from './branch.model';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_MANAGER'
  | 'RECEPTIONIST'
  | 'TRAINER'
  | 'ACCOUNTANT';

export interface OrganizationSummary {
  id: number;
  name: string;
  multiBranch: boolean;
  currencyCode: string;
  timezone: string;
  logoUrl?: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  roles: UserRole[];
  branches: BranchSummary[];
  organization: OrganizationSummary;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}
