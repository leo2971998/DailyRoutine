import { api } from '@/lib/api-client';
import type { ScheduleEvent, Subtask } from '@/types';

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

export type SplitTaskPayload = {
  text: string;
  max_steps?: number;
};

export type SplitTaskResponse = {
  steps: string[];
};

export type SubtaskBulkPayload = {
  items: Array<{
    description: string;
    duration_minutes?: number | null;
    due_at?: string | null;
  }>;
};

export type SubtaskBulkResponse = {
  inserted: number;
  items: Subtask[];
};

export type HabitCoachPayload = {
  signal: 'too_easy' | 'just_right' | 'too_hard';
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

export async function splitTaskText(payload: SplitTaskPayload): Promise<SplitTaskResponse> {
  const { data } = await api.post<SplitTaskResponse>('/tasks/ai/split', payload);
  return data;
}

export async function createSubtasks(
  taskId: string,
  payload: SubtaskBulkPayload
): Promise<SubtaskBulkResponse> {
  const { data } = await api.post<SubtaskBulkResponse>(`/tasks/${taskId}/subtasks/bulk`, payload);
  return data;
}

export async function applyHabitCoach(
  habitId: string,
  payload: HabitCoachPayload
): Promise<void> {
  await api.post(`/habits/${habitId}/coach/apply`, payload);
}
