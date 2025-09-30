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
  const cardBg = useColorModeValue(
    'linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(255, 237, 213, 0.92))',
    'gray.800'
  );
  const border = useColorModeValue('rgba(251, 191, 36, 0.3)', 'gray.700');

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
      borderRadius="22px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 8 }}
      boxShadow="0 12px 40px rgba(217, 119, 6, 0.16)"
      h="100%"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={-20}
        right={-30}
        w="200px"
        h="200px"
        borderRadius="full"
        bg="rgba(249, 115, 22, 0.18)"
      />
      <Box
        position="absolute"
        bottom={-40}
        left={-20}
        w="240px"
        h="240px"
        borderRadius="full"
        bg="rgba(250, 204, 21, 0.22)"
      />
      <Stack spacing={6} h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            Habit Momentum
          </Text>
          <Text fontSize="sm" color="brand.900" opacity={0.7}>
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
  const accent = useColorModeValue('rgba(255, 255, 255, 0.82)', 'whiteAlpha.200');
  const border = useColorModeValue('rgba(251, 191, 36, 0.35)', 'whiteAlpha.300');
  const percent = Math.min((habit.completed_today / habit.goal_per_day) * 100, 100);

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
      boxShadow="0 10px 28px rgba(217, 119, 6, 0.14)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={-20}
        left={-30}
        w="140px"
        h="140px"
        borderRadius="full"
        bg="rgba(251, 146, 60, 0.18)"
      />
      <Box
        position="absolute"
        bottom={-24}
        right={-24}
        w="160px"
        h="160px"
        borderRadius="full"
        bg="rgba(250, 204, 21, 0.18)"
      />
      <Stack spacing={1}>
        <Text fontWeight="semibold" color="brand.800">
          {habit.title}
        </Text>
        <Text fontSize="sm" color="brand.900" opacity={0.65}>
          {habit.completed_today}/{habit.goal_per_day} today • streak {habit.streak}
        </Text>
      </Stack>
      <Progress value={percent} borderRadius="full" colorScheme="orange" bg="rgba(251, 191, 36, 0.2)" />
      <Box h="120px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Tooltip
              cursor={{ fill: 'rgba(249, 115, 22, 0.12)' }}
              contentStyle={{
                background: 'rgba(71, 51, 39, 0.92)',
                borderRadius: '14px',
                color: 'white',
                border: 'none'
              }}
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
