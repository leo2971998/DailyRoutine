import { Grid, GridItem } from '@chakra-ui/react';
import DailyLogCard from '../DailyLogCard';
import HabitBoard from '../HabitBoard';
import { DashboardState } from '../../api/types';

interface HabitsTabProps {
  data: DashboardState;
}

const HabitsTab = ({ data }: HabitsTabProps) => (
  <Grid templateColumns={{ base: '1fr', xl: 'repeat(3, 1fr)' }} gap={{ base: 6, xl: 8 }}>
    <GridItem colSpan={{ base: 1, xl: 2 }}>
      <HabitBoard habits={data.habits} />
    </GridItem>
    <GridItem>
      <DailyLogCard log={data.daily_log} checklist={data.checklist} />
    </GridItem>
  </Grid>
);

export default HabitsTab;
