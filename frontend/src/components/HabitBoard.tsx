import {
  Box,
  Button,
  HStack,
  IconButton,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useHabits, useHabitLogs, useLogHabit } from '@/hooks/useHabits';
import { useQueryClient } from '@tanstack/react-query';
import AISidekick from './AISidekick';
import HabitFeedbackToast from './HabitFeedbackToast';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { Habit, HabitLog } from '@/types';
import CardContainer from './ui/CardContainer';

type HabitWithLogs = Habit & {
  logs: HabitLog[];
};

const HabitBoard = () => {
  const toast = useToast();
  const { data: habits = [], isLoading } = useHabits();
  const { data: habitLogs = [], isLoading: isLogsLoading } = useHabitLogs();
  const logHabit = useLogHabit();
  const aiDisclosure = useDisclosure();
  const queryClient = useQueryClient();
  const [activeHabit, setActiveHabit] = useState<HabitWithLogs | null>(null);
  const [feedbackHabit, setFeedbackHabit] = useState<HabitWithLogs | null>(null);
  const apiBase = api.defaults.baseURL ?? env.API_URL;

  const enrichedHabits = useMemo<HabitWithLogs[]>(() => {
    const logsByHabit = habitLogs.reduce<Record<string, HabitLog[]>>((acc, log) => {
      if (!acc[log.habit_id]) acc[log.habit_id] = [];
      acc[log.habit_id].push(log);
      return acc;
    }, {});
    return habits.map((habit) => ({
      ...habit,
      logs: logsByHabit[habit._id] ?? [],
    }));
  }, [habits, habitLogs]);

  const isBusy = isLoading || isLogsLoading;

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

        {isBusy ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} height="220px" borderRadius="20px" />
            ))}
          </SimpleGrid>
        ) : enrichedHabits.length === 0 ? (
          <Box
            borderRadius="18px"
            borderWidth="1px"
            borderColor="border.subtle"
            p={8}
            textAlign="center"
            bg="surface.cardMuted"
          >
            <Text fontWeight="semibold" color="text.primary">
              No habits yet
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Create a habit in the API to see it appear here.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {enrichedHabits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onLog={(status) =>
                  handleLogHabit(logHabit, habit, status, toast, () => {
                    if (status === 'completed') {
                      setFeedbackHabit(habit);
                    }
                  })
                }
                isLogging={logHabit.isPending}
                onOpenSidekick={(selected) => {
                  setActiveHabit(selected);
                  aiDisclosure.onOpen();
                }}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.14}
        backgroundImage="radial-gradient(circle at 10% 18%, rgba(249, 115, 22, 0.22), transparent 60%)"
        pointerEvents="none"
      />
      {activeHabit && (
        <AISidekick
          isOpen={aiDisclosure.isOpen}
          onClose={() => {
            aiDisclosure.onClose();
            setActiveHabit(null);
          }}
          apiBase={apiBase}
          userId={activeHabit.user_id ?? env.DEMO_USER_ID}
          entityType="habit"
          entityData={activeHabit}
          intent="habit_improve"
          onApply={async (patch) => {
            if (!activeHabit) {
              throw new Error('No habit selected');
            }
            const endpoint = patch.endpoint.replace('{id}', activeHabit._id);
            await api.request({
              url: endpoint,
              method: patch.method,
              data: patch.body,
            });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['habits'] }),
              queryClient.invalidateQueries({ queryKey: ['habit-logs'] }),
            ]);
          }}
        />
      )}
      <HabitFeedbackToast
        habitId={feedbackHabit?._id ?? ''}
        habitName={feedbackHabit?.name ?? ''}
        userId={feedbackHabit?.user_id ?? env.DEMO_USER_ID}
        isOpen={!!feedbackHabit}
        onClose={() => setFeedbackHabit(null)}
      />
    </CardContainer>
  );
};

type HabitCardProps = {
  habit: HabitWithLogs;
  onLog: (status: 'completed' | 'missed') => void;
  isLogging: boolean;
  onOpenSidekick: (habit: HabitWithLogs) => void;
};

const HabitCard = ({ habit, onLog, isLogging, onOpenSidekick }: HabitCardProps) => {
  const accent = useColorModeValue('bg.secondary', 'whiteAlpha.100');
  const border = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const todayCount = getRepetitionsForDay(habit.logs, dayjs());
  const percent = Math.min((todayCount / habit.goal_repetitions) * 100, 100);
  const tooltipStyles = useColorModeValue(
    {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '14px',
      color: '#1f2937',
      border: '1px solid rgba(15, 23, 42, 0.08)',
    },
    {
      background: 'rgba(17, 24, 39, 0.92)',
      borderRadius: '14px',
      color: '#f9fafb',
      border: '1px solid rgba(148, 163, 184, 0.35)',
    }
  );

  const chartData = buildWeeklyProgress(habit.logs).map((value, index) => ({
    day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index],
    value,
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
      <IconButton
        aria-label="Improve habit with AI"
        icon={<span role="img" aria-hidden="true">✨</span>}
        size="sm"
        variant="ghost"
        position="absolute"
        top={3}
        right={3}
        onClick={() => onOpenSidekick(habit)}
      />
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
          {habit.name}
        </Text>
        <Text fontSize="sm" color="text.secondary">
          {todayCount}/{habit.goal_repetitions} today • goal {habit.goal_period}
        </Text>
      </Stack>
      <Progress value={percent} borderRadius="full" colorScheme="orange" bg="rgba(251, 191, 36, 0.2)" />
      <Box h="120px" position="relative" zIndex={1} minHeight="120px">
        <ResponsiveContainer width="100%" height="100%" minHeight={120}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Tooltip cursor={{ fill: 'rgba(249, 115, 22, 0.12)' }} contentStyle={tooltipStyles} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="rgba(148, 163, 184, 0.9)" />
            <YAxis hide domain={[0, Math.max(...chartData.map((d) => d.value), habit.goal_repetitions)]} />
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
          onClick={() => onLog('missed')}
          isDisabled={habit.goal_period !== 'daily' || isLogging}
        >
          Missed today
        </Button>
        <Button
          size="sm"
          colorScheme="orange"
          borderRadius="full"
          onClick={() => onLog('completed')}
          isLoading={isLogging}
        >
          Log completion
        </Button>
      </HStack>
    </Stack>
  );
};

const handleLogHabit = (
  mutation: ReturnType<typeof useLogHabit>,
  habit: Habit,
  status: 'completed' | 'missed',
  toast: ReturnType<typeof useToast>,
  onLogged?: () => void
) => {
  mutation.mutate(
    {
      habit_id: habit._id,
      date: dayjs().format('YYYY-MM-DD'),
      status,
      completed_repetitions: status === 'completed' ? 1 : 0,
    },
    {
      onSuccess: () => {
        toast({ title: status === 'completed' ? 'Habit logged' : 'Marked missed', status: 'success' });
        onLogged?.();
      },
      onError: () => {
        toast({ title: 'Could not update habit log', status: 'error' });
      },
    }
  );
};

const buildWeeklyProgress = (logs: HabitLog[]) => {
  const start = dayjs().startOf('day').subtract(6, 'day');
  return Array.from({ length: 7 }).map((_, index) => {
    const date = start.add(index, 'day');
    return getRepetitionsForDay(logs, date);
  });
};

const getRepetitionsForDay = (logs: HabitLog[], date: dayjs.Dayjs) => {
  return logs
    .filter((log) => dayjs(log.date).isSame(date, 'day'))
    .reduce((acc, log) => acc + (log.status === 'completed' ? log.completed_repetitions : 0), 0);
};

export default HabitBoard;
