import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { ListResponse, ScheduleEvent } from '@/types';

export function useSchedule(userId = env.DEMO_USER_ID) {
  return useQuery({
    queryKey: ['schedule', userId],
    queryFn: async () => {
      const { data } = await api.get<ListResponse<ScheduleEvent>>('/v1/schedule-events', {
        params: { user_id: userId },
      });
      return data.items;
    },
  });
}
