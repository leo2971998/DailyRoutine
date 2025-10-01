import {
  Badge,
  Box,
  HStack,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useHabits, useHabitLogs } from '@/hooks/useHabits';
import type { Habit, HabitLog } from '@/types';
import CardContainer from './ui/CardContainer';

const DailyLogCard = () => {
  const { data: logs = [], isLoading } = useHabitLogs();
  const { data: habits = [] } = useHabits();
  const badgeBackground = useColorModeValue('bg.accent', 'whiteAlpha.100');
  const badgeBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const accentText = useColorModeValue('brand.600', 'brand.200');

  const habitLookup = useMemo(() => createHabitLookup(habits), [habits]);
  const entries = useMemo(() => sortLogs(logs), [logs]);

  return (
    <CardContainer surface="muted">
      <Stack spacing={{ base: 6, md: 7 }} position="relative" zIndex={1}>
        <Stack spacing={2}>
          <HStack spacing={3} align={{ base: 'flex-start', md: 'center' }} flexWrap="wrap">
            <Badge
              borderRadius="full"
              px={4}
              py={1.5}
              bg={badgeBackground}
              borderWidth="1px"
              borderColor={badgeBorder}
              color={accentText}
              fontWeight="semibold"
            >
              Habit Log
            </Badge>
            <Text color={accentText} fontWeight="semibold" fontSize="lg">
              {dayjs().format('dddd, MMM D')}
            </Text>
            <Badge colorScheme="orange" borderRadius="full" px={3} py={1} fontSize="0.7rem">
              {entries.length} entries
            </Badge>
          </HStack>
          <Text color="text.secondary" maxW="3xl">
            A quick view of your recent habit updates.
          </Text>
        </Stack>

        {isLoading ? (
          <Stack spacing={4}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} height="64px" borderRadius="16px" />
            ))}
          </Stack>
        ) : entries.length === 0 ? (
          <Box
            borderRadius="16px"
            borderWidth="1px"
            borderColor="border.subtle"
            p={6}
            textAlign="center"
            bg="surface.cardMuted"
          >
            <Text fontWeight="semibold" color="text.primary">
              No habit logs yet
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Log a habit to see it appear here.
            </Text>
          </Box>
        ) : (
          <Stack spacing={3}>
            {entries.map((entry) => (
              <LogRow key={entry._id} entry={entry} habitLookup={habitLookup} />
            ))}
          </Stack>
        )}
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.28}
        backgroundImage="radial-gradient(circle at 12% 18%, rgba(249, 115, 22, 0.22), transparent 55%), radial-gradient(circle at 82% 12%, rgba(253, 186, 116, 0.22), transparent 55%)"
        pointerEvents="none"
      />
    </CardContainer>
  );
};

type LogRowProps = {
  entry: HabitLog;
  habitLookup: Record<string, Habit>;
};

const LogRow = ({ entry, habitLookup }: LogRowProps) => {
  const habit = habitLookup[entry.habit_id];
  const bg = useColorModeValue('surface.cardMuted', 'whiteAlpha.100');
  const border = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const statusColor = entry.status === 'completed' ? 'green' : 'red';

  return (
    <HStack
      spacing={4}
      p={4}
      borderRadius="16px"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      align="flex-start"
    >
      <Stack spacing={1} flex={1}>
        <HStack justify="space-between">
          <Text fontWeight="semibold" color="text.primary">
            {habit?.name ?? 'Habit'}
          </Text>
          <Badge colorScheme={statusColor}>{entry.status}</Badge>
        </HStack>
        <Text fontSize="sm" color="text.secondary">
          {dayjs(entry.date).format('MMM D, h:mm A')}
        </Text>
        {entry.completed_repetitions > 1 && (
          <Text fontSize="xs" color="text.muted">
            {entry.completed_repetitions} repetitions
          </Text>
        )}
      </Stack>
    </HStack>
  );
};

const createHabitLookup = (habits: Habit[]) => {
  return habits.reduce<Record<string, Habit>>((acc, habit) => {
    acc[habit._id] = habit;
    return acc;
  }, {});
};

const sortLogs = (logs: HabitLog[]) => {
  return [...logs].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
};

export default DailyLogCard;
