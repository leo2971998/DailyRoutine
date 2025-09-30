export type RoutineCategory = 'focus' | 'wellness' | 'collaboration' | 'personal';

export interface RoutineTask {
  id: string;
  title: string;
  scheduled_for?: string | null;
  completed: boolean;
  category: RoutineCategory;
}

export interface Habit {
  id: string;
  title: string;
  goal_per_day: number;
  completed_today: number;
  streak: number;
  weekly_progress: number[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  cover_image?: string | null;
  color_scheme: string;
}

export interface ProgressSnapshot {
  tasks_completed: number;
  tasks_total: number;
  habits_completed: number;
  habits_total: number;
}

export interface DashboardState {
  user: string;
  greeting: string;
  date: string;
  checklist: RoutineTask[];
  habits: Habit[];
  schedule: ScheduleEvent[];
  progress: ProgressSnapshot;
}
