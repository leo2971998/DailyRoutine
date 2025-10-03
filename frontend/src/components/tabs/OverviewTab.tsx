import { Grid, GridItem } from '@chakra-ui/react';
import GreetingCard from '../GreetingCard';
import AIPlanCard from '../AIPlanCard';
import type { Habit, HabitLog, Task, User } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { useHabitLogs } from '@/hooks/useHabits';
import { useSchedule } from '@/hooks/useSchedule';

interface OverviewTabProps {
  user?: User;
  tasks: Task[];
  habits: Habit[];
  isTasksLoading: boolean;
  isHabitsLoading: boolean;
}

const OverviewTab = ({ user, tasks, habits, isTasksLoading, isHabitsLoading }: OverviewTabProps) => {
  const { data: completedTasks = [], isLoading: isCompletedLoading } = useTasks(undefined, {
    is_completed: true,
  });
  const { data: habitLogs = [], isLoading: isHabitLogsLoading } = useHabitLogs();
  const { data: scheduleEvents = [], isLoading: isScheduleLoading } = useSchedule();

  const summaryLoading =
    isTasksLoading || isHabitsLoading || isCompletedLoading || isHabitLogsLoading || isScheduleLoading;

  return (
    <Grid templateColumns={{ base: '1fr', lg: 'repeat(6, 1fr)' }} gap={{ base: 6, lg: 8 }} alignItems="stretch">
      <GridItem colSpan={{ base: 1, lg: 4 }}>
        <GreetingCard
          user={user}
          tasks={tasks}
          completedTasks={completedTasks}
          habits={habits}
          habitLogs={habitLogs}
          isLoading={summaryLoading}
        />
      </GridItem>
      <GridItem colSpan={{ base: 1, lg: 2 }}>
        <AIPlanCard
          tasks={tasks}
          habits={habits}
          events={scheduleEvents}
          userId={user?._id}
          isLoading={summaryLoading}
        />
      </GridItem>
    </Grid>
  );
};

export default OverviewTab;
