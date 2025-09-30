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
  wellness: 'brand.400',
  focus: 'brand.500',
  collaboration: 'brand.600',
  personal: 'brand.300'
};

const categoryIllustrations: Record<string, string> = {
  wellness:
    'linear-gradient(135deg, rgba(253, 224, 71, 0.9), rgba(249, 115, 22, 0.85))',
  focus: 'linear-gradient(135deg, rgba(251, 146, 60, 0.9), rgba(234, 88, 12, 0.85))',
  collaboration:
    'linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(253, 186, 116, 0.85))',
  personal: 'linear-gradient(135deg, rgba(255, 237, 213, 0.95), rgba(251, 191, 36, 0.85))'
};

const ChecklistCard = ({ checklist }: ChecklistCardProps) => {
  const queryClient = useQueryClient();
  const cardBg = useColorModeValue(
    'linear-gradient(150deg, rgba(255, 255, 255, 0.97), rgba(255, 237, 213, 0.92))',
    'gray.800'
  );
  const border = useColorModeValue('rgba(251, 191, 36, 0.35)', 'gray.700');
  const rowBg = useColorModeValue('rgba(255, 255, 255, 0.86)', 'whiteAlpha.200');

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
      borderRadius="22px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 8 }}
      boxShadow="0 12px 40px rgba(217, 119, 6, 0.16)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.3}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'480\' height=\'320\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg stroke=\'rgba(255,255,255,0.45)\' stroke-width=\'0.8\' fill=\'none\'%3E%3Cpath d=\'M30 100c28-40 56-40 84 0s56 40 84 0 56-40 84 0 56 40 84 0\'/%3E%3C/g%3E%3C/svg%3E')"
      />
      <Stack spacing={6}>
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
            <Stack key={category} spacing={4} position="relative">
              <Badge
                bg={`${categoryColors[category] || 'brand.500'}33`}
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
                    boxShadow="0 8px 24px rgba(217, 119, 6, 0.12)"
                  >
                    <Box
                      w="46px"
                      h="46px"
                      borderRadius="16px"
                      bg={categoryIllustrations[category] || categoryIllustrations.focus}
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
    </Box>
  );
};

export default ChecklistCard;
