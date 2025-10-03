import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createScheduleBulk, planSchedule } from '@/api/clients';
import { env } from '@/lib/env';
import type { Task } from '@/types';
import CardContainer from './ui/CardContainer';

dayjs.extend(utc);

type AutoschedulePlannerProps = {
  tasks: Task[];
  userId?: string;
  isTasksLoading?: boolean;
};

type SelectedDurations = Record<string, number>;

type PlanState = {
  blocks: Array<{ task_id: string; start_time: string; end_time: string }>;
  overflow: string[];
} | null;

const MIN_DURATION = 15;
const MAX_DURATION = 240;
const STEP_DURATION = 15;

const AutoschedulePlanner = ({ tasks, userId = env.DEMO_USER_ID, isTasksLoading }: AutoschedulePlannerProps) => {
  const [selectedDurations, setSelectedDurations] = useState<SelectedDurations>({});
  const [windowStart, setWindowStart] = useState(() =>
    toDateTimeLocal(dayjs().startOf('day').add(9, 'hour'))
  );
  const [windowEnd, setWindowEnd] = useState(() =>
    toDateTimeLocal(dayjs().add(1, 'day').startOf('day').add(18, 'hour'))
  );
  const [isPlanning, setIsPlanning] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [plan, setPlan] = useState<PlanState>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const listBg = useColorModeValue('bg.secondary', 'whiteAlpha.100');
  const listBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');

  const selectedTasks = useMemo(() =>
    tasks.filter((task) => selectedDurations[task._id] != null),
    [tasks, selectedDurations]
  );

  const tasksById = useMemo(() => {
    const mapping: Record<string, Task> = {};
    for (const task of tasks) {
      mapping[task._id] = task;
    }
    return mapping;
  }, [tasks]);

  const canPlan = selectedTasks.length > 0 && windowStart && windowEnd;

  const handleToggleTask = (taskId: string, isChecked: boolean) => {
    setPlan(null);
    setSelectedDurations((prev) => {
      const next = { ...prev };
      if (isChecked) {
        next[taskId] = prev[taskId] ?? 30;
      } else {
        delete next[taskId];
      }
      return next;
    });
  };

  const handleDurationChange = (taskId: string, value: number) => {
    setPlan(null);
    setSelectedDurations((prev) => ({
      ...prev,
      [taskId]: Math.max(MIN_DURATION, Math.min(MAX_DURATION, value || MIN_DURATION)),
    }));
  };

  const handlePlan = async () => {
    if (!canPlan || !userId) return;
    const start = dayjs(windowStart);
    const end = dayjs(windowEnd);

    if (!start.isValid() || !end.isValid()) {
      toast({ title: 'Enter a valid planning window', status: 'warning' });
      return;
    }

    if (start.isAfter(end)) {
      toast({ title: 'Check your planning window', status: 'warning' });
      return;
    }

    setIsPlanning(true);
    try {
      const response = await planSchedule({
        user_id: userId,
        window: { start: start.toISOString(), end: end.toISOString() },
        tasks: selectedTasks.map((task) => ({
          _id: task._id,
          duration_minutes: selectedDurations[task._id],
        })),
        block_minutes: STEP_DURATION,
      });
      setPlan(response);
      if (response.blocks.length === 0) {
        toast({ title: 'No available time slots found', status: 'info' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not generate a schedule', status: 'error' });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCommit = async () => {
    if (!plan || plan.blocks.length === 0 || !userId) return;

    setIsCommitting(true);
    try {
      await createScheduleBulk({
        user_id: userId,
        blocks: plan.blocks.map((block) => {
          const task = tasksById[block.task_id];
          const summary = task?.description ?? 'Scheduled focus block';
          return {
            summary,
            start_time: block.start_time,
            end_time: block.end_time,
            task_id: block.task_id,
            description: task?.description,
          };
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      toast({ title: 'Schedule saved', status: 'success' });
      setPlan(null);
      setSelectedDurations({});
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not save events', status: 'error' });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <CardContainer surface="muted">
      <Stack spacing={6} position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Autoschedule selected tasks
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Pick tasks, choose a window, and let DailyRoutine find the focus blocks for you.
          </Text>
        </Stack>

        <Stack spacing={3}>
          <FormControl>
            <FormLabel fontSize="sm">Planning window start</FormLabel>
            <Input
              type="datetime-local"
              value={windowStart}
              onChange={(event) => setWindowStart(event.target.value)}
              borderRadius="14px"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Planning window end</FormLabel>
            <Input
              type="datetime-local"
              value={windowEnd}
              onChange={(event) => setWindowEnd(event.target.value)}
              borderRadius="14px"
            />
          </FormControl>
        </Stack>

        <Stack spacing={3}>
          <Text fontWeight="semibold" fontSize="sm" color="text.secondary">
            Select tasks to include
          </Text>
          {isTasksLoading ? (
            <Stack spacing={3}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height="56px" borderRadius="16px" />
              ))}
            </Stack>
          ) : tasks.length === 0 ? (
            <Box
              borderRadius="16px"
              borderWidth="1px"
              borderColor={listBorder}
              p={6}
              textAlign="center"
              bg={listBg}
            >
              <Text fontWeight="semibold">No tasks available</Text>
              <Text fontSize="sm" color="text.secondary">
                Create tasks first to generate a plan.
              </Text>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {tasks.map((task) => {
                const isSelected = selectedDurations[task._id] != null;
                return (
                  <HStack
                    key={task._id}
                    spacing={4}
                    align="center"
                    justify="space-between"
                    bg={listBg}
                    borderRadius="16px"
                    borderWidth="1px"
                    borderColor={listBorder}
                    p={4}
                    flexWrap="wrap"
                  >
                    <Stack spacing={1} flex="1">
                      <Checkbox
                        isChecked={isSelected}
                        onChange={(event) => handleToggleTask(task._id, event.target.checked)}
                      >
                        <Text fontWeight="medium" color="text.primary">
                          {task.description}
                        </Text>
                      </Checkbox>
                      {task.due_date && (
                        <Badge alignSelf="flex-start" colorScheme="orange" variant="subtle">
                          Due {dayjs(task.due_date).format('MMM D, h:mm A')}
                        </Badge>
                      )}
                    </Stack>
                    <Stack spacing={1} align="flex-end">
                      <Text fontSize="xs" color="text.secondary">
                        Duration (minutes)
                      </Text>
                      <NumberInput
                        size="sm"
                        maxW="120px"
                        min={MIN_DURATION}
                        max={MAX_DURATION}
                        step={STEP_DURATION}
                        value={selectedDurations[task._id] ?? MIN_DURATION}
                        isDisabled={!isSelected}
                        onChange={(_, value) => handleDurationChange(task._id, value)}
                      >
                        <NumberInputField borderRadius="12px" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Stack>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </Stack>

        <HStack spacing={3}>
          <Button
            colorScheme="orange"
            onClick={handlePlan}
            isDisabled={!canPlan}
            isLoading={isPlanning}
          >
            Plan schedule
          </Button>
          {plan && (
            <Button
              variant="ghost"
              onClick={() => setPlan(null)}
              isDisabled={isPlanning || isCommitting}
            >
              Clear
            </Button>
          )}
        </HStack>

        {plan && (
          <Stack spacing={4}>
            <Divider />
            <Stack spacing={2}>
              <Text fontWeight="semibold" color="text.primary">
                Suggested blocks
              </Text>
              {plan.blocks.length === 0 ? (
                <Text fontSize="sm" color="text.secondary">
                  No openings were found in the selected window.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {plan.blocks.map((block) => {
                    const task = tasksById[block.task_id];
                    return (
                      <Box
                        key={`${block.task_id}-${block.start_time}`}
                        borderRadius="14px"
                        borderWidth="1px"
                        borderColor={listBorder}
                        bg={listBg}
                        p={4}
                      >
                        <Text fontWeight="medium" color="text.primary">
                          {task?.description ?? 'Task'}
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                          {dayjs(block.start_time).format('MMM D, h:mm A')} –{' '}
                          {dayjs(block.end_time).format('h:mm A')}
                        </Text>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Stack>
            {plan.overflow.length > 0 && (
              <Stack spacing={2}>
                <Text fontWeight="semibold" color="text.primary">
                  Overflow
                </Text>
                <Text fontSize="sm" color="text.secondary">
                  Could not fit {plan.overflow.length} task(s):
                </Text>
                <VStack align="stretch" spacing={2}>
                  {plan.overflow.map((taskId) => (
                    <Text key={taskId} fontSize="sm" color="text.secondary">
                      • {tasksById[taskId]?.description ?? taskId}
                    </Text>
                  ))}
                </VStack>
              </Stack>
            )}
            {plan.blocks.length > 0 && (
              <Button
                alignSelf="flex-start"
                colorScheme="orange"
                onClick={handleCommit}
                isLoading={isCommitting}
              >
                Save to calendar
              </Button>
            )}
          </Stack>
        )}
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.12}
        backgroundImage="radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.18), transparent 60%)"
        pointerEvents="none"
      />
    </CardContainer>
  );
};

function toDateTimeLocal(value: dayjs.Dayjs) {
  return value.local().format('YYYY-MM-DDTHH:mm');
}

export default AutoschedulePlanner;
