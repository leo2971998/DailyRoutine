export type Id = string;

export type Priority = 'high' | 'medium' | 'low';
export type HabitPeriod = 'daily' | 'weekly';
export type HabitStatus = 'completed' | 'missed';

export type User = {
  _id: Id;
  email: string;
  name: string;
  created_at: string;
};

export type Task = {
  _id: Id;
  user_id: Id;
  description: string;
  is_completed: boolean;
  due_date: string | null;
  priority: Priority;
  created_at: string;
};

export type Habit = {
  _id: Id;
  user_id: Id;
  name: string;
  goal_repetitions: number;
  goal_period: HabitPeriod;
  created_at: string;
};

export type HabitLog = {
  _id: Id;
  habit_id: Id;
  user_id: Id;
  date: string;
  completed_repetitions: number;
  status: HabitStatus;
};

export type ScheduleEvent = {
  _id: Id;
  user_id: Id;
  title: string;
  start_time: string;
  end_time: string;
  description?: string | null;
};

export type ListResponse<T> = {
  total: number;
  items: T[];
};

export type ProgressSummary = {
  tasks_completed: number;
  tasks_total: number;
  habits_completed: number;
  habits_total: number;
};
