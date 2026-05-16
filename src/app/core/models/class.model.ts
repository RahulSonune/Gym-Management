export interface ClassType {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
  defaultCapacity: number;
}

export interface ClassSchedule {
  id: number;
  branchId: number;
  classTypeName: string;
  trainerName: string;
  startAt: string;
  endAt: string;
  capacity: number;
  bookedCount: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
}
