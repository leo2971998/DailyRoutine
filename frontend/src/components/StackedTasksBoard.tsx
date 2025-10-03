import React, { useMemo, useState } from 'react'
import { Box, Stack, VStack, HStack, Button, Text, useBreakpointValue, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Textarea, Input, Select, FormControl, FormLabel, useToast } from '@chakra-ui/react'
import dayjs from 'dayjs'
import { FiStar, FiPlus } from 'react-icons/fi'
import type { Task } from '@/types'
import { useTasks, useToggleTask, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import TaskGroup from './TaskGroup'
import { env } from '@/lib/env'

export default function StackedTasksBoard() {
  const { data: allTasks = [], isLoading } = useTasks()
  const toggleTask = useToggleTask()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const toast = useToast()

  const isMobile = useBreakpointValue({ base: true, md: false })

  const aiPromptDisclosure = useDisclosure()
  const manualCreateDisclosure = useDisclosure()
  const [aiPrompt, setAiPrompt] = useState('')
  const [isCreatingFromAI, setIsCreatingFromAI] = useState(false)
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium')

  const now = new Date()
  const isToday = (iso?: string | null) => iso ? dayjs(iso).isSame(now, 'day') : false
  const isPast = (iso?: string | null) => iso ? dayjs(iso).isBefore(now, 'day') : false
  const isFuture = (iso?: string | null) => iso ? dayjs(iso).isAfter(now, 'day') : true

  const groups = useMemo(() => ({
    Overdue: allTasks.filter(t => !t.is_completed && !!t.due_date && isPast(t.due_date) && !isToday(t.due_date)),
    Today: allTasks.filter(t => !t.is_completed && !!t.due_date && isToday(t.due_date)),
    Upcoming: allTasks.filter(t => !t.is_completed && (t.due_date == null || isFuture(t.due_date))),
    Done: allTasks.filter(t => !!t.is_completed),
  }), [allTasks])

  const handleComplete = (task: Task) => {
    toggleTask.mutate({ taskId: task._id, is_completed: !task.is_completed })
  }

  const handleSnooze = (task: Task) => {
    const tomorrow = dayjs().add(1, 'day').hour(9).minute(0).second(0).millisecond(0).toISOString()
    updateTask.mutate({ taskId: task._id, updates: { due_date: tomorrow } })
  }

  const handleEdit = (task: Task) => {
    // could open an edit modal later; quick toggle priority cycle as placeholder
    const nextPriority: Task['priority'] = task.priority === 'high' ? 'medium' : task.priority === 'medium' ? 'low' : 'high'
    updateTask.mutate({ taskId: task._id, updates: { priority: nextPriority } })
  }

  const handleDelete = (task: Task) => {
    deleteTask.mutate(task._id)
  }

  const resetManualForm = () => {
    setNewTaskDescription('')
    setNewTaskDueDate('')
    setNewTaskPriority('medium')
  }

  const handleManualCreateClose = () => {
    resetManualForm()
    manualCreateDisclosure.onClose()
  }

  const handleCreateTaskManually = () => {
    const description = newTaskDescription.trim()
    if (!description) {
      toast({ title: 'Please enter a task description', status: 'warning' })
      return
    }

    createTask.mutate(
      {
        description,
        due_date: newTaskDueDate ? dayjs(newTaskDueDate).endOf('day').toISOString() : null,
        priority: newTaskPriority,
      },
      {
        onSuccess: () => {
          toast({ title: 'Task added', status: 'success' })
          resetManualForm()
          manualCreateDisclosure.onClose()
        },
        onError: () => {
          toast({ title: 'Could not create task', status: 'error' })
        },
      }
    )
  }

  const handleAICreateTasks = async () => {
    const prompt = aiPrompt.trim()
    if (!prompt) {
      toast({ title: 'Please enter a task prompt', status: 'warning' })
      return
    }

    setIsCreatingFromAI(true)
    try {
      const res = await fetch(`${env.API_URL}/v1/ai/tasks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: env.DEMO_USER_ID, prompt, intent: 'create_multiple_tasks' }),
      })
      if (!res.ok) throw new Error('Failed to create tasks')
      const data = await res.json()

      for (const item of data.tasks as Array<{ description: string; priority?: 'high'|'medium'|'low' }>) {
        await createTask.mutateAsync({
          description: item.description,
          due_date: null,
          priority: item.priority ?? 'medium',
        })
      }

      toast({ title: `Created ${data.tasks.length} tasks`, status: 'success' })
      setAiPrompt('')
      aiPromptDisclosure.onClose()
    } catch (e) {
      console.error('AI create error', e)
      toast({ title: 'Failed to create tasks from prompt', status: 'error' })
    } finally {
      setIsCreatingFromAI(false)
    }
  }

  if (isLoading) {
    return (
      <Box p={4}><Text color="text.muted">Loading tasks...</Text></Box>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="bold">Tasks</Text>
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="orange"
            leftIcon={<FiPlus />}
            onClick={() => {
              resetManualForm()
              manualCreateDisclosure.onOpen()
            }}
          >
            Add Task
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="orange"
            leftIcon={<FiStar />}
            onClick={aiPromptDisclosure.onOpen}
          >
            AI Task Creator
          </Button>
        </HStack>
      </HStack>

      <Stack spacing={4} direction={isMobile ? 'column' : 'row'} align="stretch">
        {Object.entries(groups).map(([title, list]) => (
          <TaskGroup
            key={title}
            title={title}
            tasks={list}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onEdit={handleEdit}
            onDelete={handleDelete}
            defaultCollapsed={title === 'Done' || (isMobile && title === 'Upcoming')}
          />
        ))}
      </Stack>

      <Modal isOpen={manualCreateDisclosure.isOpen} onClose={handleManualCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  placeholder="What do you need to get done?"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Due date</FormLabel>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={handleManualCreateClose}>Cancel</Button>
              <Button colorScheme="orange" onClick={handleCreateTaskManually} isLoading={createTask.isPending}>Add</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={aiPromptDisclosure.isOpen} onClose={aiPromptDisclosure.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>AI Task Creator</ModalHeader>
          <ModalBody>
            <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={4} />
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={aiPromptDisclosure.onClose}>Cancel</Button>
              <Button colorScheme="orange" onClick={handleAICreateTasks} isLoading={isCreatingFromAI} isDisabled={!aiPrompt.trim()}>Create</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
