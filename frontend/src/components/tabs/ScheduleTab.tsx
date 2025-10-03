import { Box, Stack, useBreakpointValue } from '@chakra-ui/react';
import AutoschedulePlanner from '../AutoschedulePlanner';
import ScheduleCard from '../ScheduleCard';
import type { Task } from '@/types';
import { env } from '@/lib/env';

type ScheduleTabProps = {
  tasks: Task[];
  isTasksLoading: boolean;
  userId?: string;
};

const ScheduleTab = ({ tasks, isTasksLoading, userId = env.DEMO_USER_ID }: ScheduleTabProps) => {
  const layout = useBreakpointValue<'column' | 'row'>({ base: 'column', lg: 'row' });

  return (
    <Stack spacing={8} maxW="5xl" mx="auto">
      <Box>
        <ScheduleCard layout={layout ?? 'column'} userId={userId} />
      </Box>
      <AutoschedulePlanner tasks={tasks} userId={userId} isTasksLoading={isTasksLoading} />
    </Stack>
  );
};

export default ScheduleTab;
