import { Injectable, inject } from '@angular/core';
import { delay, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { MOCK_STAFF } from '../data/mock-data';
import { StaffCreateRequest, StaffUpdateRequest, StaffUser } from '../models';
import {
  sealStaffPiiRequest,
  staffPiiEncryptionEnabled,
  unsealStaffPii,
} from '../utils/staff-pii-rx.util';
import { transformStaffPiiDeep } from '../utils/staff-pii-crypto.util';

/** API may send `active` (Jackson boolean naming) instead of `isActive`. */
type StaffApiUser = StaffUser & { active?: boolean };

function normalizeStaffUser(user: StaffApiUser): StaffUser {
  return {
    ...user,
    isActive: user.isActive ?? user.active ?? false,
  };
}

function normalizeStaffUsers(users: StaffApiUser[]): StaffUser[] {
  return users.map(normalizeStaffUser);
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly api = inject(ApiBaseService);
  private mockStaff: StaffUser[] = [...MOCK_STAFF];

  list(): Observable<StaffUser[]> {
    if (environment.useMockApi) {
      return this.mockList();
    }
    return unsealStaffPii(this.api['get']<StaffApiUser[]>('/staff')).pipe(
      map((rows) => normalizeStaffUsers(rows))
    );
  }

  getById(id: number): Observable<StaffUser> {
    if (environment.useMockApi) {
      return this.mockGetById(id);
    }
    return unsealStaffPii(this.api['get']<StaffApiUser>(`/staff/${id}`)).pipe(
      map((row) => normalizeStaffUser(row))
    );
  }

  create(request: StaffCreateRequest): Observable<StaffUser> {
    if (environment.useMockApi) {
      return this.mockCreate(request);
    }
    return sealStaffPiiRequest(request, (body) =>
      this.api['post']<StaffUser>('/staff', body)
    );
  }

  /** Mock API only — used to block login for deactivated staff. */
  findMockByEmail(email: string): StaffUser | undefined {
    const normalized = email.trim().toLowerCase();
    return this.mockStaff.find((s) => s.email.trim().toLowerCase() === normalized);
  }

  update(id: number, request: StaffUpdateRequest): Observable<StaffUser> {
    if (environment.useMockApi) {
      return this.mockUpdate(id, request);
    }
    return sealStaffPiiRequest(request, (body) =>
      this.api['put']<StaffApiUser>(`/staff/${id}`, body)
    ).pipe(map((row) => normalizeStaffUser(row)));
  }

  private mockGetById(id: number): Observable<StaffUser> {
    const user = this.mockStaff.find((s) => s.id === id);
    if (!user) {
      return throwError(() => new Error('Staff member not found'));
    }
    return this.mockList().pipe(
      switchMap((rows) => {
        const row = rows.find((s) => s.id === id);
        return row ? of(row).pipe(delay(200)) : throwError(() => new Error('Staff member not found'));
      })
    );
  }

  private mockUpdate(id: number, request: StaffUpdateRequest): Observable<StaffUser> {
    const index = this.mockStaff.findIndex((s) => s.id === id);
    if (index < 0) {
      return throwError(() => new Error('Staff member not found'));
    }

    const branchNames = request.branchIds.map((bid) => {
      const names: Record<number, string> = { 1: 'Main Branch', 2: 'Downtown' };
      return names[bid] ?? `Branch ${bid}`;
    });

    const updated: StaffUser = {
      ...this.mockStaff[index],
      fullName: request.fullName,
      email: request.email,
      phone: request.phone,
      roles: request.roles,
      isActive: request.isActive ?? this.mockStaff[index].isActive,
      branchIds: request.branchIds,
      branchNames,
    };

    const persist = (user: StaffUser) => {
      this.mockStaff[index] = user;
      return of(user).pipe(delay(300));
    };

    if (!staffPiiEncryptionEnabled()) {
      return persist(updated);
    }

    return from(
      transformStaffPiiDeep(updated, environment.clientStorageSecret, true) as Promise<StaffUser>
    ).pipe(
      switchMap((sealed) => persist(sealed)),
      switchMap((stored) =>
        from(
          transformStaffPiiDeep(stored, environment.clientStorageSecret, false) as Promise<StaffUser>
        )
      )
    );
  }

  private mockList(): Observable<StaffUser[]> {
    const rows = [...this.mockStaff];
    if (!staffPiiEncryptionEnabled()) {
      return of(rows).pipe(delay(200));
    }
    return from(
      transformStaffPiiDeep(rows, environment.clientStorageSecret, false) as Promise<StaffUser[]>
    ).pipe(delay(200));
  }

  private mockCreate(request: StaffCreateRequest): Observable<StaffUser> {
    const branchNames = request.branchIds.map((id) => {
      const names: Record<number, string> = { 1: 'Main Branch', 2: 'Downtown' };
      return names[id] ?? `Branch ${id}`;
    });
    const created: StaffUser = {
      id: Math.max(0, ...this.mockStaff.map((s) => s.id)) + 1,
      fullName: request.fullName,
      email: request.email,
      phone: request.phone,
      roles: request.roles,
      isActive: true,
      branchNames,
      branchIds: request.branchIds,
    };

    const persist = (user: StaffUser) => {
      this.mockStaff.push(user);
      return of(user).pipe(delay(300));
    };

    if (!staffPiiEncryptionEnabled()) {
      return persist(created);
    }

    return from(
      transformStaffPiiDeep(created, environment.clientStorageSecret, true) as Promise<StaffUser>
    ).pipe(
      switchMap((sealed) => persist(sealed)),
      switchMap((stored) =>
        from(
          transformStaffPiiDeep(stored, environment.clientStorageSecret, false) as Promise<StaffUser>
        )
      )
    );
  }
}
