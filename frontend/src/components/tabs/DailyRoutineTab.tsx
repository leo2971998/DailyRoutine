import { Grid, GridItem } from '@chakra-ui/react';
import ModernKanbanBoard from '../ModernKanbanBoard';
import type { User } from '@/types';

interface DailyRoutineTabProps {
  user?: User;
}

const DailyRoutineTab = ({ user }: DailyRoutineTabProps) => {
  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr' }} gap={{ base: 6, lg: 8 }} alignItems="stretch">
      <GridItem colSpan={1}>
        <ModernKanbanBoard />
      </GridItem>
    </Grid>
  );
};

export default DailyRoutineTab;
