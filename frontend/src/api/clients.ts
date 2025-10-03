import { api } from '@/lib/api-client';
import type { ScheduleEvent } from '@/types';

export type PlanTaskInput = {
  _id: string;
  duration_minutes: number;
};

export type PlanWindowInput = {
  start: string;
  end: string;
};

export type PlanSchedulePayload = {
  user_id: string;
  tasks: PlanTaskInput[];
  window: PlanWindowInput;
  block_minutes?: number;
};

export type PlanScheduleResponse = {
  blocks: Array<{
    task_id: string;
    start_time: string;
    end_time: string;
  }>;
  overflow: string[];
};

export type BulkScheduleBlock = {
  summary: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  task_id?: string;
};

export type BulkSchedulePayload = {
  user_id: string;
  blocks: BulkScheduleBlock[];
};

export type BulkScheduleResponse = {
  inserted: number;
  items: ScheduleEvent[];
};

export async function planSchedule(
  payload: PlanSchedulePayload
): Promise<PlanScheduleResponse> {
  const { data } = await api.post<PlanScheduleResponse>('/scheduler/plan', payload);
  return data;
}

export async function createScheduleBulk(
  payload: BulkSchedulePayload
): Promise<BulkScheduleResponse> {
  const { data } = await api.post<BulkScheduleResponse>('/schedule-events/bulk', payload);
  return data;
}
