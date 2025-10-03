import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
  useBreakpointValue,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { FormEvent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FiCheck, FiClock, FiEdit2, FiMoreVertical, FiPlus, FiStar } from 'react-icons/fi';
import { useTasks, useToggleTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { env } from '@/lib/env';
import type { Task } from '@/types';
import CardContainer from './ui/CardContainer';

// High contrast priority colors for dark mode and mobile
const PRIORITY_COLORS = {
  high: { 
    bg: { light: 'red.100', dark: 'red.950' },
    color: { light: 'red.800', dark: 'red.200' },
    border: { light: 'red.300', dark: 'red.700' },
    accent: { light: 'red.500', dark: 'red.400' },
    dot: { light: 'red.600', dark: 'red.400' }
  },
  medium: { 
    bg: { light: 'orange.100', dark: 'orange.950' },
    color: { light: 'orange.800', dark: 'orange.200' },
    border: { light: 'orange.300', dark: 'orange.700' },
    accent: { light: 'orange.500', dark: 'orange.400' },
    dot: { light: 'orange.600', dark: 'orange.400' }
  },
  low: { 
    bg: { light: 'green.100', dark: 'green.950' },
    color: { light: 'green.800', dark: 'green.200' },
    border: { light: 'green.300', dark: 'green.700' },
    accent: { light: 'green.500', dark: 'green.400' },
    dot: { light: 'green.600', dark: 'green.400' }
  },
};

const WeeklyKanbanBoardFixed = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const toggleTask = useToggleTask();
  const createTask = useCreateTask();
  const toast = useToast();
  
  // States for regular task creation
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  
  // States for AI prompt feature
  const aiPromptDisclosure = useDisclosure();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCreatingFromAI, setIsCreatingFromAI] = useState(false);
  
  // States for editing
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const updateTask = useUpdateTask();
  
  // States for mobile completion
  const mobileCompleteDisclosure = useDisclosure();
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  
  const inputBg = useColorModeValue('white', 'whiteAlpha.100');
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Generate week days for the calendar view
  const weekDays = useMemo(() => {
    const startOfWeek = dayjs().startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, []);

  // Group tasks by day and priority
  const groupedTasks = useMemo(() => {
    const result = weekDays.reduce((acc, day) => {
      acc[day.format('YYYY-MM-DD')] = {
        high: [],
        medium: [],
        low: [],
        done: [],
      };
      return acc;
    }, {} as Record<string, Record<'high' | 'medium' | 'low', Task[]> & { done: Task[] }>);

    // Group tasks by day and priority
    tasks.forEach(task => {
      const taskDate = task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      
      if (result[taskDate]) {
        if (task.is_completed) {
          result[taskDate].done.push(task);
        } else {
          result[taskDate][task.priority || 'medium'].push(task);
        }  
      }
    });

    return result;
  }, [tasks, weekDays]);

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      toast({ title: 'Please describe the task', status: 'warning' });
      return;
    }
    
    createTask.mutate({
      description: trimmed,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
    }, {
      onSuccess: () => {
        setDescription('');
        setDueDate('');
        setPriority('medium');
        toast({ title: 'Task added', status: 'success' });
      },
      onError: () => {
        toast({ title: 'Could not create task', status: 'error' });
      },
    });
  };

  const handleCompleteTask = (task: Task) => {
    toggleTask.mutate({
      taskId: task._id,
      is_completed: true,
    }, {
      onSuccess: () => {
        toast({ 
          title: `✅ ${task.description}`, 
          status: 'success',
          duration: 2000,
        });
        mobileCompleteDisclosure.onClose();
      }
    });
  };

  const TaskCard: React.FC<{ task: Task; priority: 'high' | 'medium' | 'low' }> = ({ task, priority }) => {
    const priorityColor = PRIORITY_COLORS[priority];
    const cardBg = useColorModeValue(priorityColor.bg.light, priorityColor.bg.dark);
    const textColor = useColorModeValue(priorityColor.color.light, priorityColor.color.dark);
    const borderColor = useColorModeValue(priorityColor.border.light, priorityColor.border.dark);
    const dotColor = useColorModeValue(priorityColor.dot.light, priorityColor.dot.dark);
    
    return (
      <Box
        p={4}
        borderRadius="16px"
        bg={cardBg}
        border="2px solid"
        borderColor={borderColor}
        transition="all 0.2s"
        cursor={isMobile ? 'pointer' : 'default'}
        _hover={!isMobile ? { 
          transform: 'translateY(-2px)', 
          shadow: 'lg',
          borderColor: dotColor
        } : {}}
        onClick={() => {
          if (isMobile) {
            setCompletingTask(task);
            mobileCompleteDisclosure.onOpen();
          }
        }}
      >
        <Flex align="center" gap={3}>
          <Checkbox
            flex="1"
            isChecked={task.is_completed}
            onChange={(e) =>
              toggleTask.mutate({ taskId: task._id, is_completed: e.target.checked })
            }
            colorScheme={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green'}
            isDisabled={toggleTask.isPending}
            size="lg"
          >
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={textColor}
              textDecoration={task.is_completed ? 'line-through' : 'none'}
            >
              {task.description}
            </Text>
          </Checkbox>
          
          {/* Priority Indicator */}
          <Box
            w={4}
            h={4}
            borderRadius="full"
            bg={dotColor}
            flexShrink={0}
          />
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Task options"
              icon={<FiMoreVertical />}
              size="sm"
              variant="ghost"
            >
              Actions
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => {}} icon={<FiEdit2 />}>
                Edit Task
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>
    );
  };

  const CompletedTaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Box
      p={4}
      borderRadius="16px"
      bg={useColorModeValue('green.50', 'green.950')}
      border="2px solid"
      borderColor={useColorModeValue('green.200', 'green.700')}
      opacity={0.8}
    >
      <Flex align="center" gap={3}>
        <Box color="green.500">
          <FiCheck size={20} />
        </Box>
        <Text
          fontSize="sm"
          color={useColorModeValue('green.700', 'green.300')}
          textDecoration="line-through"
          fontWeight="semibold"
          flex="1"
        >
          {task.description}
        </Text>
        <Badge
          size="sm"
          colorScheme="green"
          borderRadius="full"
        >
          Done
        </Badge>
      </Flex>
    </Box>
  );

  const DayColumn = ({ day, tasks }: { day: dayjs.Dayjs, tasks: Record<'high' | 'medium' | 'low', Task[]> & { done: Task[] } }) => {
    const isToday = day.isSame(dayjs(), 'day');
    const totalTasks = Object.values(tasks).flat().length;
    
    return (
      <Box minH="300px">
        {/* Day Header */}
        <Box textAlign="center" mb={5}>
          <Text fontSize="sm" fontWeight="bold" color={isToday ? 'brand.600' : 'text.secondary'}>
            {day.format('ddd')}
          </Text>
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color={isToday ? 'brand.600' : 'text.primary'}
          >
            {day.format('D')}
          </Text>
          {totalTasks > 0 && (
            <Badge 
              size="sm" 
              colorScheme={isToday ? 'brand' : 'gray'} 
              borderRadius="full" 
              mt={1}
            >
              {totalTasks}
            </Badge>
          )}
        </Box>

        {/* Priority Sections */}
        <VStack spacing={4} align="stretch">
          {/* High Priority */}
          {tasks.high.length > 0 && (
            <Box>
              <Flex align="center" gap={2} mb={3}>
                <Box 
                  w={4} 
                  h={4} 
                  bg={useColorModeValue('red.500', 'red.400')} 
                  borderRadius="full" 
                />
                <Text 
                  fontSize="xs" 
                  fontWeight="bold" 
                  color={useColorModeValue('red.600', 'red.400')}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  HIGH
                </Text>
              </Flex>
              <VStack spacing={2} align="stretch">
                {tasks.high.map((task) => (
                  <TaskCard key={task._id} task={task} priority="high" />
                ))}
              </VStack>
            </Box>
          )}

          {/* Medium Priority */}
          {tasks.medium.length > 0 && (
            <Box>
              <Flex align="center" gap={2} mb={3}>
                <Box 
                  w={4} 
                  h={4} 
                  bg={useColorModeValue('orange.500', 'orange.400')} 
                  borderRadius="full" 
                />
                <Text 
                  fontSize="xs" 
                  fontWeight="bold" 
                  color={useColorModeValue('orange.600', 'orange.400')}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  MEDIUM
                </Text>
              </Flex>
              <VStack spacing={2} align="stretch">
                {tasks.medium.map((task) => (
                  <TaskCard key={task._id} task={task} priority="medium" />
                ))}
              </VStack>
            </Box>
          )}

          {/* Low Priority */}
          {tasks.low.length > 0 && (
            <Box>
              <Flex align="center" gap={2} mb={3}>
                <Box 
                  w={4} 
                  h={4} 
                  bg={useColorModeValue('green.500', 'green.400')} 
                  borderRadius="full" 
                />
                <Text 
                  fontSize="xs" 
                  fontWeight="bold" 
                  color={useColorModeValue('green.600', 'green.400')}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  LOW
                </Text>
              </Flex>
              <VStack spacing={2} align="stretch">
                {tasks.low.map((task) => (
                  <TaskCard key={task._id} task={task} priority="low" />
                ))}
              </VStack>
            </Box>
          )}

          {/* Completed Tasks */}
          {tasks.done.length > 0 && (
            <Box>
              <Flex align="center" gap={2} mb={3}>
                <Box 
                  w={4} 
                  h={4} 
                  bg={useColorModeValue('gray.500', 'gray.400')} 
                  borderRadius="full" 
                />
                <Text 
                  fontSize="xs" 
                  fontWeight="bold" 
                  color={useColorModeValue('gray.600', 'gray.400')}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  DONE
                </Text>
              </Flex>
              <VStack spacing={2} align="stretch">
                {tasks.done.map((task) => (
                  <CompletedTaskCard key={task._id} task={task} />
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <CardContainer surface="muted">
        <VStack spacing={4}>
          <div>Loading weekly tasks...</div>
        </VStack>
      </CardContainer>
    );
  }

  return (
    <CardContainer surface="muted">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Weekly Task Board
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Drag tasks on PC, tap to complete on mobile. Colors: 🔴 High • 🟠 Medium • 🟢 Low
          </Text>
        </Stack>

        {/* Create Task Forms */}
        <Stack spacing={4}>
          {/* Quick Add */}
          <Box
            as="form"
            onSubmit={handleCreateTask}
            bg={useColorModeValue('white', 'whiteAlpha.100')}
            p={5}
            borderRadius="20px"
            borderWidth="2px"
            borderColor={useColorModeValue('border.subtle', 'whiteAlpha.200')}
            boxShadow={useColorModeValue('sm', 'lg')}
          >
            <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr auto' }} gap={4} alignItems="end">
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" color={useColorModeValue('text.primary', 'whiteAlpha.800')}>
                    Quick Add Task
                  </FormLabel>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What needs to get done?"
                    borderRadius="12px"
                    bg={inputBg}
                    borderWidth="2px"
                    borderColor={useColorModeValue('brand.200', 'brand.600')}
                    _focus={{ borderColor: 'brand.400' }}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" color={useColorModeValue('text.primary', 'whiteAlpha.800')}>
                    Due Date
                  </FormLabel>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    borderRadius="12px"
                    bg={inputBg}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" color={useColorModeValue('text.primary', 'whiteAlpha.800')}>
                    Priority
                  </FormLabel>
                  <Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                    borderRadius="12px"
                    bg={inputBg}
                    borderWidth="2px"
                    borderColor={
                      priority === 'high' ? useColorModeValue('red.300', 'red.600') : 
                      priority === 'medium' ? useColorModeValue('orange.300', 'orange.600') : 
                      useColorModeValue('green.300', 'green.600')
                    }
                  >
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟠 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem>
                <Button 
                  type="submit" 
                  colorScheme="orange" 
                  borderRadius="12px"
                  fontWeight="bold"
                  isLoading={createTask.isPending}
                >
                  Add Task
                </Button>
              </GridItem>
            </Grid>
          </Box>

          {/* AI Creator */}
          <Button
            leftIcon={<FiStar />}
            variant="outline"
            onClick={aiPromptDisclosure.onOpen}
            borderRadius="12px"
            borderWidth="2px"
            borderColor={useColorModeValue('brand.300', 'brand.600')}
            color={useColorModeValue('brand.600', 'brand.400')}
            _hover={{ bg: useColorModeValue('brand.50', 'whiteAlpha.100'), transform: 'translateY(-1px)' }}
            fontWeight="semibold"
          >
            ✨ AI Task Creator
          </Button>
        </Stack>

        {/* Weekly Board */}
        {tasks.length === 0 ? (
          <Box
            borderRadius="20px"
            borderWidth="2px"
            borderColor="border.subtle"
            p={8}
            textAlign="center"
            bg="surface.cardMuted"
          >
            <Text fontWeight="semibold" color="text.primary" fontSize="lg">
              No tasks for this week
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Add your first task to start organizing your week
            </Text>
          </Box>
        ) : (
          <Box>
            {/* Desktop: Full Week View */}
            <VStack spacing={6} display={{ base: 'none', lg: 'flex' }}>
              <Grid templateColumns="repeat(7, 1fr)" gap={4} w="full">
                {weekDays.map((day) => (
                  <GridItem key={day.format('YYYY-MM-DD')}>
                    <DayColumn 
                      day={day} 
                      tasks={groupedTasks[day.format('YYYY-MM-DD')]} 
                    />
                  </GridItem>
                ))}
              </Grid>
            </VStack>

            {/* Mobile: Horizontal Scroll */}
            <Box 
              display={{ base: 'flex', lg: 'none' }}
              gap={6}
              overflowX="auto"
              pb={4}
              css={{
                '&::-webkit-scrollbar': { height: '8px' },
                '&::-webkit-scrollbar-track': { background: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'), borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb': { background: useColorModeValue('rgba(0,0,0,0.3)', 'rgba(255,255,255,0.3)'), borderRadius: '4px' },
              }}
            >
              {weekDays.map((day) => (
                <Box 
                  key={day.format('YYYY-MM-DD')}
                  flex="0 0 90vw" 
                  minW="320px"
                >
                  <DayColumn 
                    day={day} 
                    tasks={groupedTasks[day.format('YYYY-MM-DD')]} 
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </VStack>

      {/* Mobile Completion Modal */}
      <Modal
        isOpen={mobileCompleteDisclosure.isOpen}
        onClose={mobileCompleteDisclosure.onClose}
        size="md"
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <ModalHeader>
            <Text fontWeight="bold">Complete Task?</Text>
          </ModalHeader>
          <ModalBody>
            {completingTask && (
              <VStack spacing={4} align="stretch">
                <Box 
                  p={4} 
                  bg={useColorModeValue('green.50', 'green.950')} 
                  borderRadius="12px" 
                  border="2px solid" 
                  borderColor={useColorModeValue('green.200', 'green.700')}
                >
                  <Flex align="center" gap={3}>
                    <Box color="green.500">
                      <FiCheck size={24} />
                    </Box>
                    <Text fontSize="md" color={useColorModeValue('green.700', 'green.300')} fontWeight="semibold">
                      Mark "{completingTask.description}" as completed?
                    </Text>
                  </Flex>
                </Box>
                <VStack spacing={2}>
                  <Button
                    width="full"
                    colorScheme="green"
                    leftIcon={<FiCheck />}
                    onClick={() => handleCompleteTask(completingTask)}
                    isLoading={toggleTask.isPending}
                    borderRadius="12px"
                    fontWeight="bold"
                    size="lg"
                  >
                    ✅ Complete Task
                  </Button>
                  <Button
                    width="full"
                    onClick={mobileCompleteDisclosure.onClose}
                    borderRadius="12px"
                  >
                    Cancel
                  </Button>
                </VStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </CardContainer>
  );
};

export default WeeklyKanbanBoardFixed;
