import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { fetchDashboard, isUsingMockDashboard } from '../api/dashboard';
import { DashboardState } from '../api/types';

export const DASHBOARD_QUERY_KEY = ['dashboard'];

type DashboardEventPayload =
  | { type: 'task_updated'; payload: { taskId: string; completed: boolean; progress: DashboardState['progress'] } }
  | {
      type: 'habit_updated';
      payload: { habitId: string; completedToday: number; streak?: number | null; progress: DashboardState['progress'] };
    }
  | { type: string; payload: Record<string, unknown> };

type ServerToClientEvents = {
  dashboard_event: (payload: DashboardEventPayload) => void;
};

const isTaskUpdate = (
  payload: DashboardEventPayload
): payload is Extract<DashboardEventPayload, { type: 'task_updated' }> => payload.type === 'task_updated';

const isHabitUpdate = (
  payload: DashboardEventPayload
): payload is Extract<DashboardEventPayload, { type: 'habit_updated' }> => payload.type === 'habit_updated';

const getSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  return (
    import.meta.env.VITE_SOCKET_BASE_URL ||
    import.meta.env.VITE_WS_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8000'
  );
};

export const useDashboard = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: DASHBOARD_QUERY_KEY, queryFn: fetchDashboard });

  useEffect(() => {
    if (!query.data || isUsingMockDashboard) {
      return;
    }

    const socketUrl = getSocketUrl();
    if (!socketUrl) {
      return;
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
      query: { userId: 'wendy' }
    }) as Socket<ServerToClientEvents>;

    const onDashboardEvent = (payload: DashboardEventPayload) => {
      queryClient.setQueryData<DashboardState | undefined>(DASHBOARD_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        if (isTaskUpdate(payload)) {
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
        if (isHabitUpdate(payload)) {
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

    socket.on('dashboard_event', onDashboardEvent);

    const scheduleRefresh = () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      }, 2000);
    };

    socket.on('disconnect', scheduleRefresh);
    socket.on('connect_error', scheduleRefresh);

    return () => {
      socket.off('dashboard_event', onDashboardEvent);
      socket.off('disconnect', scheduleRefresh);
      socket.off('connect_error', scheduleRefresh);
      socket.disconnect();
    };
  }, [query.data, queryClient]);

  return query;
};
