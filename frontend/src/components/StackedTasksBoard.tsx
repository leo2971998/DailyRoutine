import React, { useMemo, useState } from 'react'
import { Box, Stack, VStack, HStack, Button, Text, useBreakpointValue, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, useToast } from '@chakra-ui/react'
import dayjs from 'dayjs'
import { FiStar } from 'react-icons/fi'
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
  const [aiPrompt, setAiPrompt] = useState('')
  const [isCreatingFromAI, setIsCreatingFromAI] = useState(false)

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
    toggleTask.mutate(task._id)
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
        await createTask.mutateAsync({ description: item.description, priority: item.priority ?? 'medium' })
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
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="bold">Tasks</Text>
        <Button size="sm" colorScheme="orange" leftIcon={<FiStar />} onClick={aiPromptDisclosure.onOpen}>AI Task Creator</Button>
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
