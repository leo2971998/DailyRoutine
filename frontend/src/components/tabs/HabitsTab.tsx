import { Grid, GridItem } from '@chakra-ui/react';
import HabitBoard from '../HabitBoard';
import DailyLogCard from '../DailyLogCard';

const HabitsTab = () => (
  <Grid templateColumns={{ base: '1fr', xl: 'repeat(3, 1fr)' }} gap={{ base: 6, xl: 8 }}>
    <GridItem colSpan={{ base: 1, xl: 2 }}>
      <HabitBoard />
    </GridItem>
    <GridItem>
      <DailyLogCard />
    </GridItem>
  </Grid>
);

export default HabitsTab;
