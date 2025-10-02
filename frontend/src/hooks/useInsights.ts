import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '@/lib/api-client';
import type { DailyInsight, MonthlyInsight } from '@/types';

export const useDailyInsight = (userId: string, date?: string, force?: boolean) => {
  return useQuery<DailyInsight>({
    queryKey: ['insights', 'daily', userId, date, force],
    queryFn: () => insightsApi.getDailyInsight(userId, date, force),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useMonthlyInsight = (userId: string, month?: string, force?: boolean) => {
  return useQuery<MonthlyInsight>({
    queryKey: ['insights', 'monthly', userId, month, force],
    queryFn: () => insightsApi.getMonthlyInsight(userId, month, force),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
