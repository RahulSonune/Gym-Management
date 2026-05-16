import { Injectable, inject } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { MOCK_MEMBERS } from '../data/mock-data';
import { Member, MemberFormData, MemberProfile, PageResponse } from '../models';
import { memberDisplayName } from '../utils/member-pii-crypto.util';
import {
  memberPiiEncryptionEnabled,
  sealMemberPiiRequest,
  unsealMemberPii,
} from '../utils/member-pii-rx.util';

function normalizeMemberPage(page: PageResponse<Member> | null | undefined): PageResponse<Member> {
  const content = Array.isArray(page?.content) ? page!.content : [];
  return {
    content,
    page: page?.page ?? 0,
    size: page?.size ?? content.length,
    totalElements: page?.totalElements ?? content.length,
    totalPages: page?.totalPages ?? 1,
  };
}

function matchesMemberSearch(m: Member, q: string): boolean {
  const search = q.toLowerCase().trim();
  if (!search) return true;
  const fullName = memberDisplayName(m).toLowerCase();
  return (
    fullName.includes(search) ||
    (m.phone ?? '').includes(q.trim()) ||
    (m.memberCode ?? '').toLowerCase().includes(search) ||
    (m.firstName ?? '').toLowerCase().includes(search) ||
    (m.lastName?.toLowerCase().includes(search) ?? false) ||
    (m.email?.toLowerCase().includes(search) ?? false)
  );
}

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly api = inject(ApiBaseService);

  list(params: {
    page?: number;
    size?: number;
    search?: string;
    branchId?: number;
    status?: string;
  }): Observable<PageResponse<Member>> {
    if (environment.useMockApi) {
      let items = [...MOCK_MEMBERS];
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            m.phone.includes(q) ||
            m.memberCode.toLowerCase().includes(q)
        );
      }
      if (params.branchId) {
        items = items.filter((m) => m.branchId === params.branchId);
      }
      if (params.status) {
        items = items.filter((m) => m.status === params.status);
      }
      return of({
        content: items,
        page: params.page ?? 0,
        size: params.size ?? 20,
        totalElements: items.length,
        totalPages: 1,
      }).pipe(delay(300));
    }

    const search = params.search?.trim() || undefined;
    const apiParams =
      memberPiiEncryptionEnabled() && search
        ? { ...params, search: undefined, size: params.size ?? 500 }
        : { ...params, search };

    return unsealMemberPii(this.api['get']<PageResponse<Member>>('/members', apiParams as never)).pipe(
      map((page) => {
        const normalized = normalizeMemberPage(page);
        if (!search) return normalized;
        const content = normalized.content.filter((m) => matchesMemberSearch(m, search));
        return {
          ...normalized,
          content,
          totalElements: content.length,
          totalPages: 1,
        };
      })
    );
  }

  getById(id: number): Observable<MemberProfile> {
    if (environment.useMockApi) {
      const member = MOCK_MEMBERS.find((m) => m.id === id);
      if (!member) throw new Error('Member not found');
      return of(member).pipe(delay(200));
    }
    return unsealMemberPii(this.api['get']<MemberProfile>(`/members/${id}`));
  }

  lookup(q: string): Observable<Member[]> {
    if (environment.useMockApi) {
      const query = q.toLowerCase();
      return of(
        MOCK_MEMBERS.filter(
          (m) =>
            m.fullName.toLowerCase().includes(query) ||
            m.phone.includes(q) ||
            m.memberCode.toLowerCase().includes(query)
        )
      ).pipe(delay(150));
    }

    if (memberPiiEncryptionEnabled()) {
      return this.list({ search: q, size: 50 }).pipe(map((page) => page.content.slice(0, 20)));
    }

    return unsealMemberPii(this.api['get']<Member[]>('/members/lookup', { q }));
  }

  create(data: MemberFormData): Observable<Member> {
    if (environment.useMockApi) {
      const newMember: Member = {
        id: Date.now(),
        memberCode: `M-2026-${String(MOCK_MEMBERS.length + 1).padStart(5, '0')}`,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName ?? ''}`.trim(),
        phone: data.phone,
        email: data.email,
        status: 'PROSPECT',
        branchId: data.branchId ?? 1,
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      return of(newMember).pipe(delay(400));
    }
    return sealMemberPiiRequest(data, (body) =>
      this.api['post']<Member>('/members', body as never)
    );
  }

  update(id: number, data: Partial<MemberFormData>): Observable<Member> {
    if (environment.useMockApi) {
      return this.getById(id).pipe(
        map((m) => ({
          ...m,
          ...data,
          fullName: `${data.firstName ?? m.firstName} ${data.lastName ?? m.lastName ?? ''}`.trim(),
        }))
      );
    }
    return sealMemberPiiRequest(data, (body) =>
      this.api['put']<Member>(`/members/${id}`, body as never)
    );
  }
}
