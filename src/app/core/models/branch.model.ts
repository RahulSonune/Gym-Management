export interface BranchSummary {
  id: number;
  name: string;
  code: string;
  isPrimary: boolean;
  isActive?: boolean;
}

export interface Branch extends BranchSummary {
  organizationId: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  openingTime?: string;
  closingTime?: string;
  maxCapacity?: number;
  isDefault: boolean;
}
