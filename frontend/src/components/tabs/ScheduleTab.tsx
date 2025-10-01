import { Box, useBreakpointValue } from '@chakra-ui/react';
import ScheduleCard from '../ScheduleCard';

const ScheduleTab = () => {
  const layout = useBreakpointValue<'column' | 'row'>({ base: 'column', lg: 'row' });

  return (
    <Box maxW="4xl" mx="auto">
      <ScheduleCard layout={layout ?? 'column'} />
    </Box>
  );
};

export default ScheduleTab;
