import { useMutation, useQuery } from '@tanstack/react-query';
import { alexaApi } from '@/lib/api-client';
import type { AlexaCommand, AlexaTestResult } from '@/types';

export const useAlexaTest = () => {
  return useMutation<AlexaCommand, Error, { command: string; userId: string }>({
    mutationFn: ({ command, userId }) => alexaApi.testCommand(command, userId),
    onError: (error) => {
      console.error('Alexa test failed:', error);
    },
  });
};

export const useAlexaHistory = (userId: string) => {
  return useQuery<AlexaTestResult[]>({
    queryKey: ['alexa', 'history', userId],
    queryFn: () => {
      // Mock history for now - in real implementation, this would fetch from backend
      return Promise.resolve([]);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
