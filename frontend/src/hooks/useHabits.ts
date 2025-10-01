import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { Habit, HabitLog, ListResponse } from '@/types';

export function useHabits(userId = env.DEMO_USER_ID) {
  return useQuery({
    queryKey: ['habits', userId],
    queryFn: async () => {
      const { data } = await api.get<ListResponse<Habit>>('/v1/habits', {
        params: { user_id: userId },
      });
      return data.items;
    },
  });
}

export function useHabitLogs(userId = env.DEMO_USER_ID, habitId?: string) {
  return useQuery({
    queryKey: ['habit-logs', userId, habitId],
    queryFn: async () => {
      const params: Record<string, string> = { user_id: userId };
      if (habitId) {
        params.habit_id = habitId;
      }
      const { data } = await api.get<ListResponse<HabitLog>>('/v1/habit-logs', {
        params,
      });
      return data.items;
    },
  });
}

export function useLogHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      habit_id: string;
      date: string;
      completed_repetitions?: number;
      status?: 'completed' | 'missed';
    }) => {
      const body = {
        user_id: env.DEMO_USER_ID,
        completed_repetitions: 1,
        status: 'completed',
        ...payload,
      };
      const { data } = await api.post<HabitLog>('/v1/habit-logs', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habit-logs'] });
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
