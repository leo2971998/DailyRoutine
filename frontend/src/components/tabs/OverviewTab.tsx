import { Grid, GridItem } from '@chakra-ui/react';
import { useMemo } from 'react';
import GreetingCard from '../GreetingCard';
import AIPlanCard from '../AIPlanCard';
import type { Habit, HabitLog, Task, User, ProgressSummary } from '@/types';
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

  const progress = useMemo<ProgressSummary>(() => {
    const todaysLogs = getTodaysHabitLogs(habitLogs);
    const completedHabitIds = new Set(
      todaysLogs.filter((log) => log.status === 'completed').map((log) => log.habit_id)
    );
    return {
      tasks_completed: completedTasks.length,
      tasks_total: completedTasks.length + tasks.length,
      habits_completed: [...completedHabitIds].length,
      habits_total: habits.length,
    };
  }, [completedTasks.length, habitLogs, habits.length, tasks.length]);

  const summaryLoading =
    isTasksLoading || isHabitsLoading || isCompletedLoading || isHabitLogsLoading || isScheduleLoading;

  return (
    <Grid templateColumns={{ base: '1fr', lg: 'repeat(6, 1fr)' }} gap={{ base: 6, lg: 8 }} alignItems="stretch">
      <GridItem colSpan={{ base: 1, lg: 4 }}>
        <GreetingCard user={user} progress={progress} isLoading={summaryLoading} />
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

function getTodaysHabitLogs(logs: HabitLog[]) {
  const today = new Date().toISOString().slice(0, 10);
  return logs.filter((log) => log.date.slice(0, 10) === today);
}

export default OverviewTab;
