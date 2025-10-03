import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Divider,
  HStack,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiCheckCircle, FiChevronDown, FiRefreshCw } from 'react-icons/fi';
import CardContainer from './ui/CardContainer';
import type { Habit, ScheduleEvent, Task } from '@/types';
import { aiSuggest } from '@/lib/aiClient';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';

interface AIPlanCardProps {
  tasks: Task[];
  habits: Habit[];
  events: ScheduleEvent[];
  userId?: string;
  isLoading?: boolean;
}

type PlanPayload = {
  wins: string[];
  stretch_goal?: string;
  pep_talk?: string;
};

const MAX_ITEMS = 5;

const defaultPlan: PlanPayload = {
  wins: [
    'Clear your workspace for five minutes',
    'Send one check-in message to a teammate',
    'Plan tomorrow’s top priority',
  ],
  stretch_goal: 'Block 30 focused minutes on your most important project',
  pep_talk: 'You are already in motion—stack these wins and enjoy the momentum.',
};

const createSummarySnapshot = (tasks: Task[], habits: Habit[], events: ScheduleEvent[]) => ({
  tasks: tasks.slice(0, MAX_ITEMS).map((task) => ({
    description: task.description,
    due_date: task.due_date,
    priority: task.priority,
  })),
  habits: habits.slice(0, MAX_ITEMS).map((habit) => ({
    name: habit.name,
    goal_repetitions: habit.goal_repetitions,
    goal_period: habit.goal_period,
  })),
  events: events.slice(0, MAX_ITEMS).map((event) => ({
    title: event.title,
    start_time: event.start_time,
    end_time: event.end_time,
    description: event.description,
  })),
});

const PlanSkeleton = () => (
  <HStack justify="center" py={6} spacing={3}>
    <Spinner />
    <Text color="gray.500">Synthesising plan…</Text>
  </HStack>
);

const PlanError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Stack spacing={4} align="center" py={6}>
    <Text color="red.500" fontWeight="medium">
      {message}
    </Text>
    <Button size="sm" variant="outline" onClick={onRetry} leftIcon={<FiRefreshCw />}>
      Try again
    </Button>
  </Stack>
);

const PlanContent = ({ plan }: { plan: PlanPayload }) => (
  <Stack spacing={4}>
    <Stack spacing={2}>
      <Text fontWeight="semibold" color="text.primary">
        Three small wins
      </Text>
      <List spacing={2} pl={1} styleType="none">
        {plan.wins.map((win, index) => (
          <ListItem key={index} display="flex" alignItems="center" gap={2}>
            <ListIcon as={FiCheckCircle} color="brand.500" />
            <Text>{win}</Text>
          </ListItem>
        ))}
      </List>
    </Stack>
    {plan.stretch_goal && (
      <Stack spacing={1}>
        <Text fontWeight="semibold" color="text.primary">
          Stretch goal
        </Text>
        <Text color="text.secondary">{plan.stretch_goal}</Text>
      </Stack>
    )}
    {plan.pep_talk && (
      <Stack spacing={1}>
        <Divider />
        <Text fontWeight="semibold" color="text.primary">
          Pep talk
        </Text>
        <Text color="text.secondary">{plan.pep_talk}</Text>
      </Stack>
    )}
  </Stack>
);

const AIPlanCard = ({ tasks, habits, events, userId = env.DEMO_USER_ID, isLoading }: AIPlanCardProps) => {
  const apiBase = api.defaults.baseURL ?? env.API_URL;
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [plan, setPlan] = useState<PlanPayload>(defaultPlan);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const cardBg = useColorModeValue('surface.cardMuted', 'whiteAlpha.100');

  const snapshot = useMemo(() => createSummarySnapshot(tasks, habits, events), [tasks, habits, events]);
  const signature = useMemo(() => JSON.stringify(snapshot), [snapshot]);

  const fetchPlan = useCallback(async () => {
    if (!userId) return;
    setIsFetching(true);
    setError(null);
    try {
      const payload = {
        user_id: userId,
        entity: { type: 'schedule', data: snapshot },
        intent: 'dashboard_plan' as const,
        preferences: {
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
      const response = await aiSuggest(apiBase, payload);
      const firstSuggestion = response.suggestions?.[0];
      const diff = (firstSuggestion?.diff ?? {}) as PlanPayload;
      if (firstSuggestion && diff.wins && diff.wins.length > 0) {
        setPlan({
          wins: diff.wins,
          stretch_goal: diff.stretch_goal ?? defaultPlan.stretch_goal,
          pep_talk: diff.pep_talk ?? firstSuggestion.explanation ?? defaultPlan.pep_talk,
        });
      } else {
        setPlan(defaultPlan);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach the AI service.';
      setError(message);
      toast({ title: 'Could not load AI plan', description: message, status: 'error' });
      setPlan(defaultPlan);
    } finally {
      setIsFetching(false);
    }
  }, [apiBase, snapshot, toast, userId]);

  useEffect(() => {
    if (isLoading) return;
    fetchPlan();
  }, [fetchPlan, isLoading, signature]);

  return (
    <CardContainer surface="muted">
      <Stack spacing={4}>
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            AI Plan for Today
          </Text>
          <HStack spacing={2}>
            <IconButton
              aria-label="Refresh plan"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={fetchPlan}
              isLoading={isFetching}
            />
            <IconButton
              aria-label={isOpen ? 'Collapse plan' : 'Expand plan'}
              icon={<FiChevronDown />}
              size="sm"
              variant="ghost"
              onClick={onToggle}
              transform={isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}
              transition="transform 0.2s ease"
            />
          </HStack>
        </HStack>
        <Collapse in={isOpen} animateOpacity>
          <Box
            borderRadius="18px"
            borderWidth="1px"
            borderColor="border.subtle"
            bg={cardBg}
            p={5}
          >
            {isFetching ? (
              <PlanSkeleton />
            ) : error ? (
              <PlanError message={error} onRetry={fetchPlan} />
            ) : (
              <PlanContent plan={plan} />
            )}
          </Box>
        </Collapse>
      </Stack>
    </CardContainer>
  );
};

export default AIPlanCard;
