import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
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
  Stack,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
  useBreakpointValue,
} from '@chakra-ui/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import { 
  FiCheck, 
  FiEdit2, 
  FiMoreVertical, 
  FiPlus, 
  FiTrash2, 
  FiStar,
  FiType,
  FiCalendar,
  FiClock
} from 'react-icons/fi';
import { useTasks, useToggleTask, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { env } from '@/lib/env';
import type { Task } from '@/types';
import CardContainer from './ui/CardContainer';

// Task priority colors - high contrast for dark mode
const PRIORITY_COLORS = {
  high: {
    bg: { light: 'red.50', dark: 'red.950' },
    color: { light: 'red.800', dark: 'red.200' },
    border: { light: 'red.300', dark: 'red.700' },
    accent: { light: 'red.500', dark: 'red.400' },
    dot: { light: 'red.600', dark: 'red.400' }
  },
  medium: {
    bg: { light: 'orange.50', dark: 'orange.950' },
    color: { light: 'orange.800', dark: 'orange.200' },
    border: { light: 'orange.300', dark: 'orange.700' },
    accent: { light: 'orange.500', dark: 'orange.400' },
    dot: { light: 'orange.600', dark: 'orange.400' }
  },
  low: {
    bg: { light: 'green.50', dark: 'green.950' },
    color: { light: 'green.800', dark: 'green.200' },
    border: { light: 'green.300', dark: 'green.700' },
    accent: { light: 'green.500', dark: 'green.400' },
    dot: { light: 'green.600', dark: 'green.400' }
  },
  completed: {
    bg: { light: 'gray.50', dark: 'gray.800' },
    color: { light: 'gray.600', dark: 'gray.400' },
    border: { light: 'gray.200', dark: 'gray.700' },
    accent: { light: 'gray.500', dark: 'gray.400' },
    dot: { light: 'gray.500', dark: 'gray.400' }
  }
};

const PRIORITY_LABELS = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
  completed: 'Completed'
};

type Column = {
  id: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  title: string;
};

const TaskCard: React.FC<{ 
  task: Task; 
  priority: 'high' | 'medium' | 'low';
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}> = ({ task, priority, onEdit, onDelete }) => {
  const priorityColor = PRIORITY_COLORS[priority];
  const cardBg = useColorModeValue(priorityColor.bg.light, priorityColor.bg.dark);
  const textColor = useColorModeValue(priorityColor.color.light, priorityColor.color.dark);
  const borderColor = useColorModeValue(priorityColor.border.light, priorityColor.border.dark);
  const dotColor = useColorModeValue(priorityColor.accent.light, priorityColor.accent.dark);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  
  return (
    <Box
      p={3}
      borderRadius="12px"
      bg={cardBg}
      border="2px solid"
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-1px)', 
        shadow: 'md',
        borderColor: dotColor
      }}
      position="relative"
    >
      <Stack spacing={3}>
        {/* Task Content */}
        <Flex align="center" gap={2}>
          <Checkbox
            flex="1"
            isChecked={task.is_completed}
            onChange={(e) => {
              // Task completion will be handled by parent component
            }}
            colorScheme={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green'}
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
          
          {/* Priority Dot */}
          <Box
            w={3}
            h={3}
            borderRadius="full"
            bg={dotColor}
            flexShrink={0}
          />
          
          {/* Action Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Task options"
              icon={<FiMoreVertical />}
              size="xs"
              variant="ghost"
              borderRadius="4px"
            >
              Actions
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => onEdit(task)} icon={<FiEdit2 />}>
                Edit Task
              </MenuItem>
              <MenuItem 
                onClick={() => onDelete(task._id)} 
                icon={<FiTrash2 />}
                color="red.500"
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        
        {/* Priority Tag */}
        <Box textAlign="left">
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={useColorModeValue(priorityColor.color.light, priorityColor.color.dark)}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            {priority} Priority
          </Text>
        </Box>
        
        {/* Task Metadata */}
        <HStack spacing={2} fontSize="xs">
          {task.due_date && (
            <HStack color="text.muted" spacing={1}>
              <FiClock size={10} />
              <Text>{dayjs(task.due_date).format('MMM D')}</Text>
            </HStack>
          )}
        </HStack>
      </Stack>
    </Box>
  );
};

const ColumnView: React.FC<{
  column: Column;
  tasks: Task[];
  onAddTask: (dayId: string, title: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}> = ({ column, tasks, onAddTask, onEditTask, onDeleteTask }) => {
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast({ title: 'Please enter a task description', status: 'warning' });
      return;
    }
    onAddTask(column.id, newTaskTitle.trim());
    setNewTaskTitle('');
    setShowAddForm(false);
    toast({ title: 'Task added', status: 'success' });
  };

  return (
    <Box w="100%" minW="250px">
      {/* Column Header */}
      <Flex
        align="center"
        justify="space-between"
        p={4}
        bg="surface.cardMuted"
        borderTopRadius="12px"
        borderX="1px solid"
        borderColor="border.subtle"
      >
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="semibold" color="text.primary">
            {column.title}
          </Text>
          <Badge
            size="sm"
            colorScheme="gray"
            borderRadius="full"
            px={2}
            bg="surface.subtle"
            color="text.muted"
          >
            {tasks.length}
          </Badge>
        </HStack>
        
        {!showAddForm && (
          <IconButton
            aria-label={`Add task to ${column.title}`}
            icon={<FiPlus />}
            size="xs"
            variant="ghost"
            onClick={() => setShowAddForm(true)}
          />
        )}
      </Flex>

      {/* Add Task Form */}
      {showAddForm && (
        <Box p={3} bg="surface.subtle" borderX="1px solid" borderColor="border.subtle">
          <VStack spacing={2}>
            <Input
              placeholder="Enter task description"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              autoFocus
              size="sm"
            />
            <HStack w="full" spacing={2}>
              <Button size="xs" onClick={handleAddTask} colorScheme="green">
                Add
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Droppable Task Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            minH="200px"
            p={3}
            bg={snapshot.isDraggingOver ? 'surface.highlight' : 'surface.default'}
            borderBottomRadius="12px"
            borderX="1px solid"
            borderBottom="1px solid"
            borderColor="border.subtle"
            transition="background-color 0.2s"
          >
            <VStack spacing={2} align="stretch">
              {tasks.map((task, index) => (
                <Draggable key={task._id} draggableId={task._id} index={index}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      opacity={snapshot.isDragging ? 0.8 : 1}
                      transform={snapshot.isDragging ? 'rotate(5deg)' : 'none'}
                    >
                      <TaskCard
                        task={task}
                        priority={task.priority || 'medium'}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                      />
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </VStack>
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

const BoardToolbar: React.FC<{
  compact: boolean;
  onToggleCompact: () => void;
  onReset: () => void;
  onAddTask: (dayId: string, title: string) => void;
}> = ({ compact, onToggleCompact, onReset, onAddTask }) => {
  const aiPromptDisclosure = useDisclosure();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCreatingFromAI, setIsCreatingFromAI] = useState(false);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toast = useToast();
  
  const handleAICreateTasks = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast({ title: 'Please enter a prompt', status: 'warning' });
      return;
    }
    
    try {
      const response = await fetch(`${env.API_URL}/v1/ai/tasks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: env.DEMO_USER_ID,
          prompt: aiPrompt,
          intent: 'create_multiple_tasks'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create tasks');
      }

      const result = await response.json();
      
      // Create tasks and distribute across days based on priority
      for (const taskData of result.tasks) {
        // Choose day based on priority
        let dayId = 'monday'; // default
        if (taskData.priority === 'high') {
          dayId = 'monday'; // High priority tasks go to Monday
        } else if (taskData.priority === 'medium') {
          dayId = 'wednesday'; // Medium priority tasks go to Wednesday
        } else {
          dayId = 'friday'; // Low priority tasks go to Friday
        }
        
        onAddTask(dayId, taskData.description);
      }

      toast({ title: `Created ${result.tasks.length} tasks`, status: 'success' });
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

  return (
    <Flex justify="space-between" align="center" p={4}>
      <HStack spacing={4}>
        <Text fontSize="lg" fontWeight="bold" color="text.primary">
          Weekly Tasks
        </Text>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleCompact}
          leftIcon={<FiType />}
        >
          {compact ? 'Normal' : 'Compact'}
        </Button>
        
        <Button size="sm" variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </HStack>

      <HStack spacing={3}>
        <Button
          size="sm"
          colorScheme="blue"
          leftIcon={<FiStar />}
          onClick={() => aiPromptDisclosure.onOpen()}
        >
          AI Task Creator
        </Button>
      </HStack>

      {/* AI Task Creator Modal */}
      <Modal isOpen={aiPromptDisclosure.isOpen} onClose={aiPromptDisclosure.onClose}>
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
    </Flex>
  );
};

const ModernKanbanBoard: React.FC = () => {
  const { data: allTasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const toast = useToast();
  const [compact, setCompact] = useState(false);

  const editDisclosure = useDisclosure();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Define weekly columns
  const columns = useMemo(() => [
    { id: 'monday', title: 'Monday' },
    { id: 'tuesday', title: 'Tuesday' },
    { id: 'wednesday', title: 'Wednesday' },
    { id: 'thursday', title: 'Thursday' },
    { id: 'friday', title: 'Friday' },
    { id: 'saturday', title: 'Saturday' },
    { id: 'sunday', title: 'Sunday' },
  ], []);

  // Group tasks by day of week (for now, distribute by priority)
  const tasksByColumn = useMemo(() => {
    const grouped = columns.reduce((acc, column) => {
      acc[column.id] = allTasks.filter(task => {
        if (task.is_completed) return false;
        
        // Distribute tasks across days based on priority
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(column.id);
        
        if (task.priority === 'high') {
          return dayIndex % 2 === 0; // High priority on Sun, Tue, Thu, Sat
        } else if (task.priority === 'medium') {
          return dayIndex % 3 === 1; // Medium priority on Mon, Thu, Sun
        } else {
          return dayIndex % 4 === 2; // Low priority on Wed, Sat
        }
      });
      return acc;
    }, {} as Record<string, Task[]>);
    
    return grouped;
  }, [allTasks, columns]);

  // Handle drag end
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const task = allTasks.find(t => t._id === draggableId);
    
    if (!task) return;

    // If moving between columns, update priority based on destination day
    if (sourceCol !== destCol) {
      let newPriority: 'high' | 'medium' | 'low' = 'medium';
      
      if (['sunday', 'tuesday', 'thursday', 'saturday'].includes(destCol)) {
        newPriority = 'high';
      } else if (['monday', 'thursday', 'sunday'].includes(destCol)) {
        newPriority = 'medium';  
      } else {
        newPriority = 'low';
      }
      
      updateTask.mutate({
        taskId: task._id,
        updates: { priority: newPriority },
      });
    }
  };

  const handleAddTask = (dayId: string, title: string) => {
    // Assign priority based on day of week
    let priority: 'high' | 'medium' | 'low' = 'medium';
    
    if (['sunday', 'tuesday', 'thursday', 'saturday'].includes(dayId)) {
      priority = 'high';
    } else if (['monday', 'thursday', 'sunday'].includes(dayId)) {
      priority = 'medium';  
    } else {
      priority = 'low';
    }
    
    createTask.mutate({
      description: title,
      priority,
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditDescription(task.description);
    setEditPriority(task.priority || 'medium');
    editDisclosure.onOpen();
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editDescription.trim()) return;

    updateTask.mutate({
      taskId: editingTask._id,
      updates: {
        description: editDescription.trim(),
        priority: editPriority,
      },
    }, {
      onSuccess: () => {
        editDisclosure.onClose();
        setEditingTask(null);
        toast({ title: 'Task updated', status: 'success' });
      },
      onError: () => {
        toast({ title: 'Failed to update task', status: 'error' });
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        toast({ title: 'Task deleted', status: 'success' });
      },
      onError: () => {
        toast({ title: 'Failed to delete task', status: 'error' });
      },
    });
  };

  const handleReset = () => {
    // Reset all tasks completion status or implement reset logic
    toast({ title: 'Board reset', status: 'info' });
  };

  if (isLoading) {
    return (
      <CardContainer>
        <Flex align="center" justify="center" py={12}>
          <Text color="text.muted">Loading tasks...</Text>
        </Flex>
      </CardContainer>
    );
  }

  return (
    <CardContainer>
      <VStack spacing={6} align="stretch">
        <BoardToolbar
          compact={compact}
          onToggleCompact={() => setCompact(!compact)}
          onReset={handleReset}
          onAddTask={handleAddTask}
        />

        <Box
          overflowX="auto"
          pb={4}
          css={{
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bg: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              bg: 'rgba(0,0,0,0.2)',
            },
          }}
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Flex
              gap={4}
              minW="max-content"
              px={2}
            >
              {columns.map((column) => (
                <ColumnView
                  key={column.id}
                  column={column}
                  tasks={tasksByColumn[column.id] || []}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </Flex>
          </DragDropContext>
        </Box>

        {/* Edit Task Modal */}
        <Modal isOpen={editDisclosure.isOpen} onClose={editDisclosure.onClose}>
          <ModalOverlay />
          <ModalContent borderRadius="20px">
            <ModalHeader>
              <Flex align="center" gap={2}>
                <FiEdit2 />
                <Text>Edit Task</Text>
              </Flex>
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Task Description</FormLabel>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter task description"
                    rows={3}
                    borderRadius="12px"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as 'high' | 'medium' | 'low')}
                    borderRadius="12px"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={editDisclosure.onClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </CardContainer>
  );
};

export default ModernKanbanBoard;