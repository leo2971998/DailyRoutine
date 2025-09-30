import { Box, useBreakpointValue } from '@chakra-ui/react';
import ScheduleCard from '../ScheduleCard';
import { DashboardState } from '../../api/types';

interface ScheduleTabProps {
  data: DashboardState;
}

const ScheduleTab = ({ data }: ScheduleTabProps) => {
  const layout = useBreakpointValue<'column' | 'row'>({ base: 'column', lg: 'row' });

  return (
    <Box maxW="4xl" mx="auto">
      <ScheduleCard schedule={data.schedule} layout={layout ?? 'column'} />
    </Box>
  );
};

export default ScheduleTab;
