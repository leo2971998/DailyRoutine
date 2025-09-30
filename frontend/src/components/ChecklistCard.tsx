import {
  Badge,
  Box,
  Checkbox,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiClock } from 'react-icons/fi';
import { RoutineTask } from '../api/types';
import { toggleTask } from '../api/dashboard';
import { DASHBOARD_QUERY_KEY } from '../hooks/useDashboard';

interface ChecklistCardProps {
  checklist: RoutineTask[];
}

const categoryColors: Record<string, string> = {
  wellness: 'green',
  focus: 'purple',
  collaboration: 'orange',
  personal: 'blue'
};

const ChecklistCard = ({ checklist }: ChecklistCardProps) => {
  const queryClient = useQueryClient();
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');
  const rowBg = useColorModeValue('gray.50', 'whiteAlpha.200');

  const mutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTask(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData(DASHBOARD_QUERY_KEY);
      queryClient.setQueryData(DASHBOARD_QUERY_KEY, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          checklist: old.checklist.map((task: RoutineTask) =>
            task.id === id ? { ...task, completed } : task
          )
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    }
  });

  const grouped = checklist.reduce<Record<string, RoutineTask[]>>((acc, task) => {
    const key = task.category ?? 'focus';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <Box
      bg={cardBg}
      borderRadius="28px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 8 }}
      boxShadow="xl"
    >
      <Stack spacing={6}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            Daily Routine Checklist
          </Text>
          <Text fontSize="sm" color="gray.500">
            Swipe through your focus, wellness and collaboration goals.
          </Text>
        </Stack>

        <VStack align="stretch" spacing={5}>
          {Object.entries(grouped).map(([category, tasks]) => (
            <Stack key={category} spacing={4}>
              <Badge
                colorScheme={categoryColors[category] || 'purple'}
                variant="subtle"
                alignSelf="flex-start"
                borderRadius="full"
                px={3}
                py={1}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
              <Stack spacing={3}>
                {tasks.map((task) => (
                  <HStack
                    key={task.id}
                    spacing={4}
                    p={4}
                    borderRadius="20px"
                    bg={rowBg}
                  >
                    <Checkbox
                      isChecked={task.completed}
                      onChange={(event) =>
                        mutation.mutate({ id: task.id, completed: event.target.checked })
                      }
                      colorScheme="brand"
                      size="lg"
                    >
                      <Stack spacing={1}>
                        <Text fontWeight="semibold">{task.title}</Text>
                        {task.scheduled_for && (
                          <HStack fontSize="sm" color="gray.500">
                            <Icon as={FiClock} />
                            <Text>{task.scheduled_for}</Text>
                          </HStack>
                        )}
                      </Stack>
                    </Checkbox>
                  </HStack>
                ))}
              </Stack>
            </Stack>
          ))}
        </VStack>
      </Stack>
    </Box>
  );
};

export default ChecklistCard;
