import { UserRole } from './auth.model';

export interface StaffUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  isActive: boolean;
  branchNames: string[];
  branchIds?: number[];
  primaryBranchId?: number;
}

export interface StaffCreateRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  roles: UserRole[];
  branchIds: number[];
  primaryBranchId?: number;
}

export interface StaffUpdateRequest {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  roles: UserRole[];
  branchIds: number[];
  primaryBranchId?: number;
  isActive?: boolean;
}
