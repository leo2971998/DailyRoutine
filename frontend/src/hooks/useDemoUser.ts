import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { User } from '@/types';

export function useDemoUser(userId = env.DEMO_USER_ID) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const { data } = await api.get<User>(`/v1/users/${userId}`);
      return data;
    },
  });
}
