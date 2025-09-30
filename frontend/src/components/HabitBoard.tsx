import {
  Box,
  Button,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { updateHabit } from '../api/dashboard';
import { Habit } from '../api/types';
import { DASHBOARD_QUERY_KEY } from '../hooks/useDashboard';
import CardContainer from './ui/CardContainer';

interface HabitBoardProps {
  habits: Habit[];
}

const HabitBoard = ({ habits }: HabitBoardProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, completed_today }: { id: string; completed_today: number }) =>
      updateHabit(id, { completed_today }),
    onMutate: async ({ id, completed_today }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData(DASHBOARD_QUERY_KEY);
      queryClient.setQueryData(DASHBOARD_QUERY_KEY, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((habit: Habit) =>
            habit.id === id ? { ...habit, completed_today } : habit
          )
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    }
  });

  return (
    <CardContainer surface="muted">
      <Stack spacing={6} h="100%" position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Habit Momentum
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Track streaks and keep the energy flowing.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onUpdate={mutation.mutate} />
          ))}
        </SimpleGrid>
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.14}
        backgroundImage="radial-gradient(circle at 10% 18%, rgba(249, 115, 22, 0.22), transparent 60%)"
        pointerEvents="none"
      />
    </CardContainer>
  );
};

interface HabitCardProps {
  habit: Habit;
  onUpdate: (payload: { id: string; completed_today: number }) => void;
}

const HabitCard = ({ habit, onUpdate }: HabitCardProps) => {
  const accent = useColorModeValue('bg.secondary', 'whiteAlpha.100');
  const border = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const percent = Math.min((habit.completed_today / habit.goal_per_day) * 100, 100);
  const tooltipStyles = useColorModeValue(
    {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '14px',
      color: '#1f2937',
      border: '1px solid rgba(15, 23, 42, 0.08)'
    },
    {
      background: 'rgba(17, 24, 39, 0.92)',
      borderRadius: '14px',
      color: '#f9fafb',
      border: '1px solid rgba(148, 163, 184, 0.35)'
    }
  );

  const chartData = habit.weekly_progress.map((value, index) => ({
    day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index],
    value
  }));

  return (
    <Stack
      spacing={4}
      p={5}
      borderRadius="20px"
      bg={accent}
      borderWidth="1px"
      borderColor={border}
      boxShadow="0 8px 24px rgba(217, 119, 6, 0.14)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={-20}
        left={-20}
        w="120px"
        h="120px"
        borderRadius="full"
        bg="rgba(251, 146, 60, 0.16)"
      />
      <Stack spacing={1} position="relative" zIndex={1}>
        <Text fontWeight="semibold" color="text.primary">
          {habit.title}
        </Text>
        <Text fontSize="sm" color="text.secondary">
          {habit.completed_today}/{habit.goal_per_day} today • streak {habit.streak}
        </Text>
      </Stack>
      <Progress value={percent} borderRadius="full" colorScheme="orange" bg="rgba(251, 191, 36, 0.2)" />
      <Box h="120px" position="relative" zIndex={1}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Tooltip
              cursor={{ fill: 'rgba(249, 115, 22, 0.12)' }}
              contentStyle={tooltipStyles}
            />
            <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="rgba(148, 163, 184, 0.9)" />
            <YAxis hide domain={[0, Math.max(...habit.weekly_progress, habit.goal_per_day)]} />
            <Bar dataKey="value" radius={[12, 12, 12, 12]} fill="url(#barGradient)" />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <HStack justify="space-between" position="relative" zIndex={1}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            onUpdate({ id: habit.id, completed_today: Math.max(0, habit.completed_today - 1) })
          }
        >
          -1
        </Button>
        <Button
          size="sm"
          colorScheme="orange"
          borderRadius="full"
          onClick={() => onUpdate({ id: habit.id, completed_today: habit.completed_today + 1 })}
        >
          Add rep
        </Button>
      </HStack>
    </Stack>
  );
};

export default HabitBoard;
