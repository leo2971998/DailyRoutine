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

export type DailyLogSource = 'manual' | 'checklist';

export interface DailyLogMood {
  id: string;
  label: string;
  emoji: string;
}

export interface DailyLogEntry {
  id: string;
  timestamp: string;
  content: string;
  source: DailyLogSource;
  related_task_id?: string | null;
  mood?: DailyLogMood | null;
  details?: string | null;
}

export interface DailyLogDay {
  date: string;
  focus: string;
  entries: DailyLogEntry[];
}

export interface GroupChallenge {
  id: string;
  title: string;
  timeframe: string;
  goal: number;
  current: number;
  unit: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar_color: string;
  progress: number;
  streak: number;
}

export interface ReactionOption {
  id: string;
  emoji: string;
  label: string;
}

export interface ActivityReaction extends ReactionOption {
  count: number;
}

export interface ActivityEntry {
  id: string;
  member_id: string;
  summary: string;
  timestamp: string;
  highlight?: string | null;
  reactions: ActivityReaction[];
}

export interface GroupProgress {
  group_name: string;
  mission: string;
  challenge: GroupChallenge;
  leaderboard: GroupMember[];
  activity_feed: ActivityEntry[];
  reaction_options: ReactionOption[];
}

export interface DashboardState {
  user: string;
  greeting: string;
  date: string;
  checklist: RoutineTask[];
  habits: Habit[];
  schedule: ScheduleEvent[];
  progress: ProgressSnapshot;
  group_progress: GroupProgress;
  daily_log: DailyLogDay;
}
