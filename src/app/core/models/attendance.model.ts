export type AttendanceMethod = 'MANUAL' | 'QR' | 'RFID' | 'BIOMETRIC';

export interface AttendanceLog {
  id: number;
  memberId: number;
  memberName: string;
  memberCode: string;
  branchId: number;
  checkInAt: string;
  checkOutAt?: string;
  method: AttendanceMethod;
}

export interface CheckInRequest {
  memberId: number;
  branchId: number;
  method: AttendanceMethod;
  deviceId?: string;
}

export interface CheckInResponse {
  allowed: boolean;
  attendanceId?: number;
  checkInAt?: string;
  member?: { id: number; fullName: string; memberCode: string };
  subscription?: { planName: string; endDate: string };
  deniedReason?: string;
  message?: string;
}

export interface CheckOutRequest {
  memberId: number;
  branchId: number;
  method: AttendanceMethod;
  deviceId?: string;
}

export interface CheckOutResponse {
  allowed: boolean;
  attendanceId?: number;
  checkInAt?: string;
  checkOutAt?: string;
  member?: { id: number; fullName: string; memberCode: string };
  deniedReason?: string;
  message?: string;
}

export interface LiveAttendance {
  attendanceId?: number;
  memberId: number;
  fullName: string;
  memberCode: string;
  checkInAt: string;
  planName?: string;
}
