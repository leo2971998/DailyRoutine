import React, { useState } from 'react'
import { Box, Heading, VStack, IconButton, Badge, HStack, useColorModeValue } from '@chakra-ui/react'
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons'
import type { Task } from '@/types'
import TaskItem from './TaskItem'

interface TaskGroupProps {
  title: string
  tasks: Task[]
  defaultCollapsed?: boolean
  onComplete: (task: Task) => void
  onSnooze: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export default function TaskGroup({ title, tasks, onComplete, onSnooze, onEdit, onDelete, defaultCollapsed = false }: TaskGroupProps) {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed)
  const cardBg = useColorModeValue('white', 'gray.900')
  const border = useColorModeValue('gray.200', 'gray.700')
  const badgeScheme = title === 'Overdue' ? 'red' : title === 'Today' ? 'blue' : title === 'Upcoming' ? 'gray' : 'green'

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3} bg={cardBg} w="full">
      <HStack as={Heading} size="sm" spacing={3} align="center" cursor="pointer" onClick={() => setCollapsed(!collapsed)}>
        <IconButton
          icon={collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
          size="xs"
          variant="ghost"
          aria-label="Toggle section"
        />
        <Box flex={1}>{title}</Box>
        <Badge ml={2} colorScheme={badgeScheme}>{tasks.length}</Badge>
      </HStack>

      {!collapsed && (
        <VStack spacing={2} mt={3} align="stretch">
          {tasks.map(task => (
            <TaskItem
              key={task._id}
              task={task}
              onComplete={onComplete}
              onSnooze={onSnooze}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </VStack>
      )}
    </Box>
  )
}
