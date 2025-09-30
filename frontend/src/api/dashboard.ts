import { mockDashboard } from '../data/mockDashboard';
import { DashboardState } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const cloneState = (state: DashboardState): DashboardState =>
  JSON.parse(JSON.stringify(state));

const recomputeProgress = (state: DashboardState): DashboardState => {
  const tasksCompleted = state.checklist.filter((task) => task.completed).length;
  const habitsCompleted = state.habits.filter(
    (habit) => habit.completed_today >= habit.goal_per_day
  ).length;

  return {
    ...state,
    progress: {
      tasks_completed: tasksCompleted,
      tasks_total: state.checklist.length,
      habits_completed: habitsCompleted,
      habits_total: state.habits.length
    }
  };
};

let currentDashboardState: DashboardState = cloneState(mockDashboard);

export const isUsingMockDashboard = true;

export const fetchDashboard = async () => {
  await delay(240);
  return cloneState(currentDashboardState);
};

export const toggleTask = async (taskId: string, completed: boolean) => {
  await delay(180);
  currentDashboardState = recomputeProgress({
    ...currentDashboardState,
    checklist: currentDashboardState.checklist.map((task) =>
      task.id === taskId ? { ...task, completed } : task
    )
  });
  return cloneState(currentDashboardState);
};

export const updateHabit = async (
  habitId: string,
  payload: { completed_today: number; streak?: number | null }
) => {
  await delay(180);
  currentDashboardState = recomputeProgress({
    ...currentDashboardState,
    habits: currentDashboardState.habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            completed_today: payload.completed_today,
            streak:
              typeof payload.streak === 'number' ? payload.streak : habit.streak
          }
        : habit
    )
  });
  return cloneState(currentDashboardState);
};
