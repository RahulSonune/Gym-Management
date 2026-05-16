import { Injectable, inject } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { MOCK_PLANS } from '../data/mock-data';
import { MembershipPlan } from '../models';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly api = inject(ApiBaseService);

  list(activeOnly = true): Observable<MembershipPlan[]> {
    if (environment.useMockApi) {
      let plans = [...MOCK_PLANS];
      if (activeOnly) plans = plans.filter((p) => p.isActive);
      return of(plans).pipe(delay(200));
    }
    return this.api['get']<MembershipPlan[]>('/plans', { active: activeOnly });
  }
}
