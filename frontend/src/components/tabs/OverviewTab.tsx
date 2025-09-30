import { Grid, GridItem } from '@chakra-ui/react';
import ChecklistCard from '../ChecklistCard';
import GreetingCard from '../GreetingCard';
import ProgressPanel from '../ProgressPanel';
import { DashboardState } from '../../api/types';

interface OverviewTabProps {
  data: DashboardState;
}

const OverviewTab = ({ data }: OverviewTabProps) => (
  <Grid templateColumns={{ base: '1fr', lg: 'repeat(5, 1fr)' }} gap={{ base: 6, lg: 8 }} alignItems="stretch">
    <GridItem colSpan={{ base: 1, lg: 3 }}>
      <GreetingCard state={data} />
    </GridItem>
    <GridItem colSpan={{ base: 1, lg: 2 }}>
      <ProgressPanel progress={data.progress} />
    </GridItem>
    <GridItem colSpan={{ base: 1, lg: 3 }}>
      <ChecklistCard checklist={data.checklist} />
    </GridItem>
  </Grid>
);

export default OverviewTab;
