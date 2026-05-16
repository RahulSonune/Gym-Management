import { Injectable, inject } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { MOCK_ATTENDANCE, MOCK_LIVE, MOCK_MEMBERS } from '../data/mock-data';
import {
  AttendanceLog,
  CheckInRequest,
  CheckInResponse,
  CheckOutRequest,
  CheckOutResponse,
  LiveAttendance,
} from '../models';
import { unsealMemberPii } from '../utils/member-pii-rx.util';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiBaseService);

  list(branchId: number): Observable<AttendanceLog[]> {
    if (environment.useMockApi) {
      return of(MOCK_ATTENDANCE.filter((a) => a.branchId === branchId)).pipe(delay(200));
    }
    return unsealMemberPii(this.api['get']<AttendanceLog[]>('/attendance', { branchId }));
  }

  live(branchId: number): Observable<LiveAttendance[]> {
    if (environment.useMockApi) {
      return of(MOCK_LIVE).pipe(delay(150));
    }
    return unsealMemberPii(this.api['get']<LiveAttendance[]>('/attendance/live', { branchId }));
  }

  checkIn(request: CheckInRequest): Observable<CheckInResponse> {
    if (environment.useMockApi) {
      const member = MOCK_MEMBERS.find((m) => m.id === request.memberId);
      if (!member) {
        return of({
          allowed: false,
          deniedReason: 'MEMBER_NOT_FOUND',
          message: 'Member not found',
        }).pipe(delay(300));
      }
      if (member.status === 'EXPIRED' || !member.activeSubscription) {
        return of({
          allowed: false,
          deniedReason: 'SUBSCRIPTION_EXPIRED',
          message: 'Membership expired or inactive',
        }).pipe(delay(300));
      }
      return of({
        allowed: true,
        attendanceId: Date.now(),
        checkInAt: new Date().toISOString(),
        member: {
          id: member.id,
          fullName: member.fullName,
          memberCode: member.memberCode,
        },
        subscription: member.activeSubscription
          ? {
              planName: member.activeSubscription.planName,
              endDate: member.activeSubscription.endDate,
            }
          : undefined,
      }).pipe(delay(400));
    }
    return unsealMemberPii(this.api['post']<CheckInResponse>('/attendance/check-in', request));
  }

  checkOut(request: CheckOutRequest): Observable<CheckOutResponse> {
    if (environment.useMockApi) {
      const member = MOCK_MEMBERS.find((m) => m.id === request.memberId);
      if (!member) {
        return of({
          allowed: false,
          deniedReason: 'MEMBER_NOT_FOUND',
          message: 'Member not found',
        }).pipe(delay(300));
      }

      const liveIndex = MOCK_LIVE.findIndex((l) => l.memberId === request.memberId);
      if (liveIndex === -1) {
        return of({
          allowed: false,
          deniedReason: 'NOT_CHECKED_IN',
          message: 'Member is not checked in',
        }).pipe(delay(300));
      }

      const now = new Date().toISOString();
      const live = MOCK_LIVE[liveIndex];
      const openLog = MOCK_ATTENDANCE.find(
        (a) => a.memberId === request.memberId && !a.checkOutAt
      );
      if (openLog) {
        openLog.checkOutAt = now;
      }
      MOCK_LIVE.splice(liveIndex, 1);

      return of({
        allowed: true,
        attendanceId: live.attendanceId ?? openLog?.id,
        checkInAt: live.checkInAt,
        checkOutAt: now,
        member: {
          id: member.id,
          fullName: member.fullName,
          memberCode: member.memberCode,
        },
        message: 'Checked out successfully',
      }).pipe(delay(400));
    }
    return unsealMemberPii(this.api['post']<CheckOutResponse>('/attendance/check-out', request));
  }
}
