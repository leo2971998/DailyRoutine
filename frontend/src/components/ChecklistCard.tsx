import {
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  Select,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { FormEvent, useMemo, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import { useTasks, useToggleTask, useCreateTask } from '@/hooks/useTasks';
import type { Task } from '@/types';
import CardContainer from './ui/CardContainer';

const priorityMeta: Record<string, { label: string; color: string }> = {
  high: { label: 'High priority', color: 'brand.500' },
  medium: { label: 'Medium priority', color: 'brand.400' },
  low: { label: 'Low priority', color: 'brand.300' },
};

const ChecklistCard = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const toggleTask = useToggleTask();
  const createTask = useCreateTask();
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const toast = useToast();
  const rowBg = 'surface.cardMuted';
  const rowBorder = 'border.subtle';
  const inputBg = useColorModeValue('white', 'rgba(255,255,255,0.05)');

  const grouped = useMemo(() => {
    return tasks.reduce<Record<'high' | 'medium' | 'low', Task[]>>(
      (acc, task) => {
        const key = task.priority ?? 'medium';
        acc[key].push(task);
        return acc;
      },
      { high: [], medium: [], low: [] }
    );
  }, [tasks]);

  const handleCreateTask = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      toast({ title: 'Please describe the task', status: 'warning' });
      return;
    }
    createTask.mutate(
      {
        description: trimmed,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
      },
      {
        onSuccess: () => {
          setDescription('');
          setDueDate('');
          setPriority('medium');
          toast({ title: 'Task added', status: 'success' });
        },
        onError: () => {
          toast({ title: 'Could not create task', status: 'error' });
        },
      }
    );
  };

  return (
    <CardContainer surface="muted">
      <Stack spacing={6} position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Daily Routine Checklist
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Capture the work that keeps momentum going.
          </Text>
        </Stack>

        <Box as="form" onSubmit={handleCreateTask} bg="bg.secondary" p={4} borderRadius="18px" borderWidth="1px" borderColor="border.subtle">
          <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr auto' }} gap={4} alignItems="end">
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Task description</FormLabel>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What needs to get done?"
                  borderRadius="14px"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Due date</FormLabel>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  borderRadius="14px"
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Priority</FormLabel>
                <Select value={priority} onChange={(event) => setPriority(event.target.value as 'high' | 'medium' | 'low')} borderRadius="14px">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <Button type="submit" colorScheme="orange" borderRadius="14px" isLoading={createTask.isPending}>
                Add task
              </Button>
            </GridItem>
          </Grid>
        </Box>

        {isLoading ? (
          <Stack spacing={4}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} height="72px" borderRadius="18px" />
            ))}
          </Stack>
        ) : tasks.length === 0 ? (
          <Box
            borderRadius="18px"
            borderWidth="1px"
            borderColor="border.subtle"
            p={8}
            textAlign="center"
            bg="surface.cardMuted"
          >
            <Text fontWeight="semibold" color="text.primary">
              No tasks yet
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Add your first task to build momentum.
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing={5}>
            {(Object.keys(grouped) as Array<'high' | 'medium' | 'low'>)
              .filter((priorityKey) => grouped[priorityKey].length > 0)
              .map((priorityKey) => (
                <Stack key={priorityKey} spacing={4}>
                  <Badge
                    bg={`${priorityMeta[priorityKey].color}1F`}
                    color={priorityMeta[priorityKey].color}
                    alignSelf="flex-start"
                    borderRadius="full"
                    px={4}
                    py={1.5}
                  >
                    {priorityMeta[priorityKey].label}
                  </Badge>
                  <Stack spacing={3}>
                    {grouped[priorityKey].map((task) => (
                      <HStack
                        key={task._id}
                        spacing={4}
                        p={4}
                        borderRadius="18px"
                        bg={rowBg}
                        borderWidth="1px"
                        borderColor={rowBorder}
                      >
                        <Checkbox
                          isChecked={task.is_completed}
                          onChange={(event) =>
                            toggleTask.mutate({ taskId: task._id, is_completed: event.target.checked })
                          }
                          colorScheme="orange"
                          size="lg"
                          isDisabled={toggleTask.isPending}
                        >
                          <Stack spacing={1}>
                            <Text fontWeight="semibold" color="text.primary">
                              {task.description}
                            </Text>
                            <HStack fontSize="sm" color="text.muted" spacing={3}>
                              <Badge colorScheme={priorityKey === 'high' ? 'red' : priorityKey === 'medium' ? 'orange' : 'yellow'} borderRadius="full" px={2}>
                                {priorityKey}
                              </Badge>
                              {task.due_date && (
                                <HStack>
                                  <FiClock />
                                  <Text>{dayjs(task.due_date).format('MMM D')}</Text>
                                </HStack>
                              )}
                            </HStack>
                          </Stack>
                        </Checkbox>
                      </HStack>
                    ))}
                  </Stack>
                </Stack>
              ))}
          </VStack>
        )}
      </Stack>
    </CardContainer>
  );
};

export default ChecklistCard;
