import {
  Box,
  Button,
  HStack,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { replanTasks } from '@/api/clients';
import { useTasks } from '@/hooks/useTasks';
import { env } from '@/lib/env';
import type { ReplanProposal } from '@/api/clients';
import CardContainer from './ui/CardContainer';

interface BacklogHealerCardProps {
  userId?: string;
}

const BacklogHealerCard = ({ userId = env.DEMO_USER_ID }: BacklogHealerCardProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [proposals, setProposals] = useState<ReplanProposal[] | null>(null);
  const [isHealing, setIsHealing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: tasks = [], isLoading } = useTasks(userId);

  const tasksById = useMemo(() => {
    return tasks.reduce<Record<string, string>>((acc, task) => {
      acc[task._id] = task.description;
      return acc;
    }, {});
  }, [tasks]);

  const overdue = useMemo(() => {
    const now = dayjs();
    return tasks.filter((task) => task.due_date && dayjs(task.due_date).isBefore(now));
  }, [tasks]);

  const handlePreview = async () => {
    if (!userId) return;
    setIsHealing(true);
    try {
      const response = await replanTasks({ user_id: userId, dry_run: true });
      setProposals(response.proposals);
      if (response.proposals.length === 0) {
        toast({ title: 'No overdue tasks', status: 'info' });
      } else {
        onOpen();
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not generate a plan', status: 'error' });
    } finally {
      setIsHealing(false);
    }
  };

  const handleApply = async () => {
    if (!userId) return;
    setIsHealing(true);
    try {
      const response = await replanTasks({ user_id: userId, dry_run: false });
      toast({ title: 'New due dates applied', status: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setProposals(response.proposals);
      setTimeout(() => setProposals(null), 2000);
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not apply updates', status: 'error' });
    } finally {
      setIsHealing(false);
    }
  };

  return (
    <CardContainer surface="muted">
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Backlog healer
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Replan overdue work into the next clear space on your calendar.
          </Text>
        </Stack>

        <Box p={4} borderRadius="18px" bg="bg.secondary">
          <Text fontSize="2xl" fontWeight="bold" color="text.primary">
            {isLoading ? '…' : overdue.length}
          </Text>
          <Text fontSize="sm" color="text.secondary">
            overdue tasks waiting for attention
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            colorScheme="orange"
            onClick={handlePreview}
            isLoading={isHealing}
            isDisabled={isLoading || overdue.length === 0}
          >
            Heal backlog
          </Button>
          {proposals && proposals.length > 0 && isOpen && (
            <Button variant="outline" onClick={handleApply} isLoading={isHealing}>
              Apply all
            </Button>
          )}
        </HStack>

        {proposals && proposals.length > 0 && (
          <Stack spacing={3} borderWidth="1px" borderColor="border.subtle" borderRadius="18px" p={4}>
            <Text fontWeight="semibold" color="text.primary">
              Proposed schedule
            </Text>
            {proposals.map((proposal) => {
              const label = tasksById[proposal.task_id] ?? `Task ${proposal.task_id.slice(-4)}`;
              return (
                <Stack key={proposal.task_id} spacing={1}>
                  <Text fontWeight="medium" color="text.primary">
                    {label}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    New due date: {dayjs(proposal.new_due_date).format('MMM D, h:mm A')}
                  </Text>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </CardContainer>
  );
};

export default BacklogHealerCard;
