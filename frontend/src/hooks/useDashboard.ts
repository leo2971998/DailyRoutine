import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard } from '../api/dashboard';
import { DashboardState } from '../api/types';

export const DASHBOARD_QUERY_KEY = ['dashboard'];

const getWebsocketUrl = () => {
  if (typeof window === 'undefined') return '';
  const url = new URL(import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000');
  url.pathname = '/ws/dashboard';
  url.searchParams.set('userId', 'wendy');
  return url.toString();
};

export const useDashboard = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: DASHBOARD_QUERY_KEY, queryFn: fetchDashboard });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const socketUrl = getWebsocketUrl();
    if (!socketUrl) {
      return;
    }

    const socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      queryClient.setQueryData<DashboardState | undefined>(DASHBOARD_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        if (payload.type === 'task_updated') {
          return {
            ...prev,
            progress: payload.payload.progress,
            checklist: prev.checklist.map((task) =>
              task.id === payload.payload.taskId
                ? { ...task, completed: payload.payload.completed }
                : task
            )
          };
        }
        if (payload.type === 'habit_updated') {
          return {
            ...prev,
            progress: payload.payload.progress,
            habits: prev.habits.map((habit) =>
              habit.id === payload.payload.habitId
                ? {
                    ...habit,
                    completed_today: payload.payload.completedToday,
                    streak: payload.payload.streak ?? habit.streak
                  }
                : habit
            )
          };
        }
        return prev;
      });
    };

    socket.onclose = () => {
      // optimistic reconnect after 2s
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      }, 2000);
    };

    return () => {
      socket.close();
    };
  }, [query.data, queryClient]);

  return query;
};
