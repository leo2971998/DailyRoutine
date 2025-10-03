import React from 'react'
import { Box, Checkbox, Text, HStack, IconButton, Menu, MenuButton, MenuList, MenuItem, Badge, useColorModeValue } from '@chakra-ui/react'
import { FiMoreVertical, FiClock } from 'react-icons/fi'
import dayjs from 'dayjs'
import type { Task } from '@/types'

interface TaskItemProps {
  task: Task
  onComplete: (task: Task) => void
  onSnooze: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export default function TaskItem({ task, onComplete, onSnooze, onEdit, onDelete }: TaskItemProps) {
  const bg = useColorModeValue('gray.50', 'gray.800')
  const bgHover = useColorModeValue('gray.100', 'gray.700')
  const textMuted = useColorModeValue('gray.600', 'gray.400')

  const priorityColorScheme = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      bg={bg}
      _hover={{ bg: bgHover }}
      transition="all 0.2s"
    >
      <HStack justify="space-between" align="start">
        <HStack align="start" spacing={3} flex={1}>
          <Checkbox
            isChecked={!!task.is_completed}
            onChange={() => onComplete(task)}
            size="lg"
            colorScheme={priorityColorScheme}
          />
          <Box>
            <HStack spacing={2} align="center">
              <Text
                fontWeight="semibold"
                textDecoration={task.is_completed ? 'line-through' : 'none'}
              >
                {task.description}
              </Text>
              <Badge colorScheme={priorityColorScheme} variant="subtle" borderRadius="full">
                {task.priority || 'medium'}
              </Badge>
            </HStack>
            <HStack spacing={2} mt={1} color={textMuted} fontSize="xs">
              {task.due_date && (
                <HStack spacing={1}>
                  <FiClock />
                  <Text>{dayjs(task.due_date).format('MMM D')}</Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </HStack>

        <Menu>
          <MenuButton as={IconButton} aria-label="Task menu" icon={<FiMoreVertical />} size="sm" variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => onSnooze(task)}>Snooze to Tomorrow</MenuItem>
            <MenuItem onClick={() => onEdit(task)}>Edit</MenuItem>
            <MenuItem onClick={() => onDelete(task)} color="red.500">Delete</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  )
}
