import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { ListResponse, Task } from '@/types';

type TaskFilters = {
  is_completed?: boolean;
};

const key = (userId: string, filters?: TaskFilters) => [
  'tasks',
  userId,
  typeof filters?.is_completed === 'boolean'
    ? filters.is_completed
      ? 'completed'
      : 'incomplete'
    : 'incomplete',
];

export function useTasks(userId = env.DEMO_USER_ID, filters?: TaskFilters) {
  return useQuery({
    queryKey: key(userId, filters),
    queryFn: async () => {
      const params: Record<string, string | boolean> = { user_id: userId };
      if (typeof filters?.is_completed === 'boolean') {
        params.is_completed = filters.is_completed;
      }
      const { data } = await api.get<ListResponse<Task>>('/v1/tasks', {
        params: {
          ...params,
          ...(typeof filters?.is_completed !== 'boolean' ? { is_completed: false } : {}),
        },
      });
      return data.items;
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, is_completed }: { taskId: string; is_completed: boolean }) => {
      const { data } = await api.patch<Task>(`/v1/tasks/${taskId}`, { is_completed });
      return data;
    },
    onMutate: async ({ taskId, is_completed }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshots = qc.getQueriesData<Task[]>(['tasks']);
      let movedTask: Task | undefined;

      snapshots.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;
        const statusKey = Array.isArray(key) ? key[2] : undefined;
        if (statusKey === 'incomplete') {
          const updated = data.filter((task) => {
            if (task._id === taskId) {
              movedTask = { ...task, is_completed };
              return !is_completed;
            }
            return true;
          });
          qc.setQueryData(key, updated);
        }
        if (statusKey === 'completed') {
          let updated = data.filter((task) => task._id !== taskId);
          if (is_completed && movedTask) {
            updated = [{ ...movedTask }, ...updated];
          }
          qc.setQueryData(key, updated);
        }
      });

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      user_id?: string;
      description: string;
      due_date?: string | null;
      priority?: 'high' | 'medium' | 'low';
    }) => {
      const body = { user_id: env.DEMO_USER_ID, priority: 'medium', ...payload };
      const { data } = await api.post<Task>('/v1/tasks', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
