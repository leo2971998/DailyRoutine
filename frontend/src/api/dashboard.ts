import api from './client';
import { DashboardState } from './types';

export const fetchDashboard = async () => {
  const { data } = await api.get<DashboardState>('/api/dashboard');
  return data;
};

export const toggleTask = async (taskId: string, completed: boolean) => {
  const { data } = await api.patch<DashboardState>(`/api/tasks/${taskId}`, {
    completed
  });
  return data;
};

export const updateHabit = async (
  habitId: string,
  payload: { completed_today: number; streak?: number | null }
) => {
  const { data } = await api.patch<DashboardState>(`/api/habits/${habitId}`, payload);
  return data;
};
