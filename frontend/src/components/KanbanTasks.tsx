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
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { FormEvent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FiCalendar, FiClock, FiEdit2, FiPlus, FiStar, FiTrash2 } from 'react-icons/fi';
import { useTasks, useToggleTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { env } from '@/lib/env';
import type { Task } from '@/types';
import CardContainer from './ui/CardContainer';

const PRIORITY_COLORS = {
  high: { bg: 'red.50', color: 'red.600', border: 'red.200' },
  medium: { bg: 'orange.50', color: 'orange.600', border: 'orange.200' },
  low: { bg: 'yellow.50', color: 'yellow.700', border: 'yellow.200' },
};

const PRIORITY_LABELS = {
  high: 'High Priority',
  medium: 'Medium Priority', 
  low: 'Low Priority',
};

const KanbanTasks = () => {
  const { data: tasks = [], isLoading } = useTasks();
  const toggleTask = useToggleTask();
  const createTask = useCreateTask();
  const toast = useToast();
  const queryClient = useQueryClient();
  
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
  
  const inputBg = useColorModeValue('white', 'rgba(255,255,255,0.05)');

  // Group tasks by status for Kanban
  const groupedTasks = useMemo(() => {
    return {
      todo: tasks.filter(task => !task.is_completed),
      done: tasks.filter(task => task.is_completed)
    };
  }, [tasks]);

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

  const handleEditTask = (task: Task) => {
    setEditingTask(task._id);
    setEditDescription(task.description);
    setEditPriority(task.priority || 'medium');
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editDescription.trim()) {
      toast({ title: 'Please enter a task description', status: 'warning' });
      return;
    }

    updateTask.mutate(
      {
        taskId: editingTask,
        updates: {
          description: editDescription.trim(),
          priority: editPriority,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Task updated', status: 'success' });
          setEditingTask(null);
          setEditDescription('');
          setEditPriority('medium');
        },
        onError: () => {
          toast({ title: 'Could not update task', status: 'error' });
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditDescription('');
    setEditPriority('medium');
  };

  const handleAICreateTasks = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast({ title: 'Please enter a task prompt', status: 'warning' });
      return;
    }

    setIsCreatingFromAI(true);
    try {
      // Call AI endpoint to parse the prompt and create multiple tasks
      const response = await fetch('/v1/ai/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: env.DEMO_USER_ID,
          prompt,
          intent: 'create_multiple_tasks'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create tasks from AI');
      }

      const result = await response.json();
      
      // Create tasks using regular API
      for (const taskDesc of result.tasks) {
        await createTask.mutateAsync({
          description: taskDesc,
          priority: 'medium' as const,
        });
      }

      toast({ 
        title: `Created ${result.tasks.length} tasks`, 
        status: 'success' 
      });
      
      setAiPrompt('');
      aiPromptDisclosure.onClose();
      
    } catch (error) {
      console.error('AI task creation error:', error);
      toast({ 
        title: 'Failed to create tasks from prompt', 
        status: 'error' 
      });
    } finally {
      setIsCreatingFromAI(false);
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const priorityColor = PRIORITY_COLORS[task.priority || 'medium'];
    const cardBg = useColorModeValue(priorityColor.bg, 'whiteAlpha.100');
    const isEditing = editingTask === task._id;
    
    return (
      <Box
        p={3}
        borderRadius="12px"
        bg={cardBg}
        border="1px solid"
        borderColor={useColorModeValue(priorityColor.border, 'whiteAlpha.200')}
        opacity={task.is_completed ? 0.6 : 1}
        transition="opacity 0.2s"
      >
        <Stack spacing={3}>
          {isEditing ? (
            // Edit Mode
            <VStack spacing={3}>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                fontSize="sm"
                borderRadius="8px"
                bg={inputBg}
              />
              <Select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as 'high' | 'medium' | 'low')}
                fontSize="xs"
                borderRadius="6px"
                bg={inputBg}
                size="sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  colorScheme="green"
                  onClick={handleSaveEdit}
                  isLoading={updateTask.isPending}
                  borderRadius="6px"
                >
                  Save
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  borderRadius="6px"
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          ) : (
            // View Mode
            <>
              <Flex align="center" gap={2}>
                <Checkbox
                  flex="1"
                  isChecked={task.is_completed}
                  onChange={(e) =>
                    toggleTask.mutate({ taskId: task._id, is_completed: e.target.checked })
                  }
                  colorScheme="orange"
                  isDisabled={toggleTask.isPending}
                >
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={useColorModeValue(priorityColor.color, 'text.primary')}
                    textDecoration={task.is_completed ? 'line-through' : 'none'}
                  >
                    {task.description}
                  </Text>
                </Checkbox>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleEditTask(task)}
                  aria-label="Edit task"
                  borderRadius="6px"
                >
                  <FiEdit2 size={12} />
                </Button>
              </Flex>
              
              <HStack spacing={2} fontSize="xs">
                <Badge
                  size="sm"
                  colorScheme={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'yellow'}
                  borderRadius="full"
                  px={2}
                >
                  {task.priority}
                </Badge>
                {task.due_date && (
                  <HStack color="text.muted" spacing={1}>
                    <FiClock size={10} />
                    <Text>{dayjs(task.due_date).format('MMM D')}</Text>
                  </HStack>
                )}
              </HStack>
            </>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <CardContainer surface="muted">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Tasks
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Organize your work with AI-powered task creation
          </Text>
        </Stack>

        {/* Create Task Forms */}
        <Stack spacing={4}>
          {/* Regular Task Creation */}
          <Box
            as="form"
            onSubmit={handleCreateTask}
            bg="bg.secondary"
            p={4}
            borderRadius="16px"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr auto' }} gap={4} alignItems="end">
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm">Quick Add</FormLabel>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What needs to get done?"
                    borderRadius="12px"
                    bg={inputBg}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm">Due Date</FormLabel>
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
                  <FormLabel fontSize="sm">Priority</FormLabel>
                  <Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                    borderRadius="12px"
                    bg={inputBg}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem>
                <Button type="submit" colorScheme="orange" borderRadius="12px" isLoading={createTask.isPending}>
                  Add
                </Button>
              </GridItem>
            </Grid>
          </Box>

          {/* AI Prompt Feature */}
          <Button
            leftIcon={<FiStar />}
            variant="outline"
            onClick={aiPromptDisclosure.onOpen}
            borderRadius="12px"
            borderColor="brand.300"
            color="brand.600"
            _hover={{ bg: 'brand.50' }}
          >
            AI Task Creator
          </Button>
        </Stack>

        {/* Kanban Board */}
        {isLoading ? (
          <Stack spacing={4}>
            <Skeleton height="120px" borderRadius="16px" />
            <Skeleton height="120px" borderRadius="16px" />
          </Stack>
        ) : tasks.length === 0 ? (
          <Box
            borderRadius="16px"
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
              Add your first task to get started
            </Text>
          </Box>
        ) : (
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
            {/* To Do Column */}
            <GridItem>
              <Stack spacing={4}>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold" color="text.primary" fontSize="sm">
                    To Do ({groupedTasks.todo.length})
                  </Text>
                </HStack>
                <VStack spacing={3} align="stretch">
                  {groupedTasks.todo.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </VStack>
              </Stack>
            </GridItem>

            {/* Done Column */}
            <GridItem>
              <Stack spacing={4}>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold" color="text.primary" fontSize="sm">
                    Done ({groupedTasks.done.length})
                  </Text>
                </HStack>
                <VStack spacing={3} align="stretch">
                  {groupedTasks.done.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </VStack>
              </Stack>
            </GridItem>
          </Grid>
        )}
      </VStack>

      {/* AI Prompt Modal */}
      <Modal
        isOpen={aiPromptDisclosure.isOpen}
        onClose={aiPromptDisclosure.onClose}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <ModalHeader>
            <Flex align="center" gap={2}>
              <FiStar color="orange" />
              <Text>AI Task Creator</Text>
            </Flex>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="text.secondary">
                Describe multiple tasks you want to create. AI will automatically parse and create them for you.
              </Text>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: 'Create 4 tasks: 1) Write project proposal, 2) Schedule team meeting, 3) Review budget, 4) Update project timeline'"
                borderRadius="12px"
                rows={4}
                resize="none"
              />
              <Box
                bg="brand.50"
                p={3}
                borderRadius="12px"
                borderWidth="1px"
                borderColor="brand.200"
              >
                <Text fontSize="xs" color="brand.700">
                  💡 Tip: Be specific and separate tasks with commas, numbers, or bullet points for best results
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={aiPromptDisclosure.onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                leftIcon={<FiStar />}
                onClick={handleAICreateTasks}
                isLoading={isCreatingFromAI}
                isDisabled={!aiPrompt.trim()}
              >
                Create Tasks
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </CardContainer>
  );
};

export default KanbanTasks;
