import { Injectable, inject } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { MOCK_DASHBOARD, MOCK_EXPIRING } from '../data/mock-data';
import { DashboardSummary, ExpiringMember } from '../models';
import { unsealMemberPii } from '../utils/member-pii-rx.util';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiBaseService);

  getSummary(branchId: number): Observable<DashboardSummary> {
    if (environment.useMockApi) {
      return of({ ...MOCK_DASHBOARD, branchId }).pipe(delay(250));
    }
    return this.api['get']<DashboardSummary>('/dashboard/summary', { branchId });
  }

  getExpiring(branchId: number, days = 30): Observable<ExpiringMember[]> {
    if (environment.useMockApi) {
      return of(MOCK_EXPIRING).pipe(delay(200));
    }
    return unsealMemberPii(
      this.api['get']<ExpiringMember[]>('/reports/expiring', { branchId, days })
    );
  }
}
