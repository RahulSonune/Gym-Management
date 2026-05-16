import { Injectable, computed, signal } from '@angular/core';
import { BranchSummary } from '../models';

const STORAGE_KEY = 'gym_selected_branch_id';

@Injectable({ providedIn: 'root' })
export class BranchContextService {
  private readonly _branches = signal<BranchSummary[]>([]);
  private readonly _multiBranch = signal(false);
  private readonly _selectedBranchId = signal<number | null>(this.loadStoredBranchId());

  readonly branches = this._branches.asReadonly();
  readonly multiBranch = this._multiBranch.asReadonly();
  readonly selectedBranchId = this._selectedBranchId.asReadonly();

  readonly selectedBranch = computed(() => {
    const id = this._selectedBranchId();
    return this._branches().find((b) => b.id === id) ?? null;
  });

  initialize(branches: BranchSummary[], multiBranch: boolean): void {
    this._branches.set(branches);
    this._multiBranch.set(multiBranch);

    const primary = branches.find((b) => b.isPrimary) ?? branches[0];
    const stored = this._selectedBranchId();
    const valid = stored && branches.some((b) => b.id === stored);
    const selected = valid ? stored! : primary?.id ?? null;
    this.setBranch(selected);
  }

  setBranch(branchId: number | null): void {
    this._selectedBranchId.set(branchId);
    if (branchId) {
      localStorage.setItem(STORAGE_KEY, String(branchId));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private loadStoredBranchId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  }
}
