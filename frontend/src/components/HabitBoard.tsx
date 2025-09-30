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
import { Habit } from '../api/types';
import { DASHBOARD_QUERY_KEY } from '../hooks/useDashboard';
import { updateHabit } from '../api/dashboard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HabitBoardProps {
  habits: Habit[];
}

const HabitBoard = ({ habits }: HabitBoardProps) => {
  const queryClient = useQueryClient();
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');

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
    <Box
      bg={cardBg}
      borderRadius="28px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 8 }}
      boxShadow="xl"
      h="100%"
    >
      <Stack spacing={6} h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            Habit Momentum
          </Text>
          <Text fontSize="sm" color="gray.500">
            Track streaks and keep the energy flowing.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onUpdate={mutation.mutate} />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
};

interface HabitCardProps {
  habit: Habit;
  onUpdate: (payload: { id: string; completed_today: number }) => void;
}

const HabitCard = ({ habit, onUpdate }: HabitCardProps) => {
  const accent = useColorModeValue('gray.50', 'whiteAlpha.200');
  const border = useColorModeValue('gray.100', 'whiteAlpha.300');
  const percent = Math.min((habit.completed_today / habit.goal_per_day) * 100, 100);

  const chartData = habit.weekly_progress.map((value, index) => ({
    day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index],
    value
  }));

  return (
    <Stack
      spacing={4}
      p={5}
      borderRadius="24px"
      bg={accent}
      borderWidth="1px"
      borderColor={border}
    >
      <Stack spacing={1}>
        <Text fontWeight="semibold">{habit.title}</Text>
        <Text fontSize="sm" color="gray.500">
          {habit.completed_today}/{habit.goal_per_day} today • streak {habit.streak}
        </Text>
      </Stack>
      <Progress value={percent} borderRadius="full" colorScheme="purple" />
      <Box h="120px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Tooltip
              cursor={{ fill: 'rgba(99, 102, 241, 0.12)' }}
              contentStyle={{
                background: 'rgba(23, 25, 35, 0.85)',
                borderRadius: '12px',
                color: 'white',
                border: 'none'
              }}
            />
            <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="rgba(148, 163, 184, 0.9)" />
            <YAxis hide domain={[0, Math.max(...habit.weekly_progress, habit.goal_per_day)]} />
            <Bar dataKey="value" radius={[12, 12, 12, 12]} fill="url(#barGradient)" />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <HStack justify="space-between">
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
          colorScheme="purple"
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
