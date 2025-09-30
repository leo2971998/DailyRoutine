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
import CardContainer from './ui/CardContainer';

interface ChecklistCardProps {
  checklist: RoutineTask[];
}

const categoryColors: Record<string, string> = {
  wellness: 'brand.400',
  focus: 'brand.500',
  collaboration: 'brand.600',
  personal: 'brand.300'
};

const ChecklistCard = ({ checklist }: ChecklistCardProps) => {
  const queryClient = useQueryClient();
  const rowBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'whiteAlpha.200');

  const mutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => toggleTask(id, completed),
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
    <CardContainer surface="muted">
      <Stack spacing={6} position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            Daily Routine Checklist
          </Text>
          <Text fontSize="sm" color="brand.900" opacity={0.7}>
            Swipe through your focus, wellness and collaboration goals.
          </Text>
        </Stack>

        <VStack align="stretch" spacing={5}>
          {Object.entries(grouped).map(([category, tasks]) => (
            <Stack key={category} spacing={4}>
              <Badge
                bg={`${categoryColors[category] || 'brand.500'}1F`}
                color={categoryColors[category] || 'brand.500'}
                alignSelf="flex-start"
                borderRadius="full"
                px={4}
                py={1.5}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
              <Stack spacing={3}>
                {tasks.map((task) => (
                  <HStack
                    key={task.id}
                    spacing={4}
                    p={4}
                    borderRadius="18px"
                    bg={rowBg}
                  >
                    <Box
                      w="46px"
                      h="46px"
                      borderRadius="16px"
                      bg={`${categoryColors[category] || 'brand.500'}33`}
                      border="1px solid rgba(251, 191, 36, 0.25)"
                      flexShrink={0}
                    />
                    <Checkbox
                      isChecked={task.completed}
                      onChange={(event) =>
                        mutation.mutate({ id: task.id, completed: event.target.checked })
                      }
                      colorScheme="orange"
                      size="lg"
                    >
                      <Stack spacing={1}>
                        <Text fontWeight="semibold" color="brand.800">
                          {task.title}
                        </Text>
                        {task.scheduled_for && (
                          <HStack fontSize="sm" color="brand.900" opacity={0.65}>
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
      <Box
        position="absolute"
        inset={0}
        opacity={0.16}
        backgroundImage="radial-gradient(circle at 14% 18%, rgba(249, 115, 22, 0.18), transparent 55%)"
        pointerEvents="none"
      />
    </CardContainer>
  );
};

export default ChecklistCard;
