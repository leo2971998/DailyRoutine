import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Spinner,
  Stack,
  useBreakpointValue
} from '@chakra-ui/react';
import { useDashboard } from './hooks/useDashboard';
import GreetingCard from './components/GreetingCard';
import ChecklistCard from './components/ChecklistCard';
import ScheduleCard from './components/ScheduleCard';
import HabitBoard from './components/HabitBoard';
import FocusFriends from './components/FocusFriends';
import ProgressPanel from './components/ProgressPanel';

function App() {
  const { data, isLoading } = useDashboard();
  const layout = useBreakpointValue<'column' | 'row'>({ base: 'column', lg: 'row' });

  if (isLoading || !data) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bgGradient="linear(to-br, white, #f0f4ff)" py={{ base: 6, md: 10 }}>
      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <Stack spacing={{ base: 6, lg: 10 }}>
          <Grid
            templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
            gap={{ base: 6, lg: 8 }}
            alignItems="stretch"
          >
            <GridItem colSpan={{ base: 1, lg: 2 }}>
              <GreetingCard state={data} />
            </GridItem>
            <GridItem>
              <ProgressPanel progress={data.progress} />
            </GridItem>
          </Grid>

          <Grid
            templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
            gap={{ base: 6, lg: 8 }}
            alignItems="stretch"
          >
            <GridItem colSpan={{ base: 1, lg: 2 }}>
              <ChecklistCard checklist={data.checklist} />
            </GridItem>
            <GridItem>
              <ScheduleCard schedule={data.schedule} layout={layout ?? 'column'} />
            </GridItem>
          </Grid>

          <Grid templateColumns={{ base: '1fr', xl: 'repeat(3, 1fr)' }} gap={{ base: 6, lg: 8 }}>
            <GridItem colSpan={{ base: 1, xl: 2 }}>
              <HabitBoard habits={data.habits} />
            </GridItem>
            <GridItem>
              <FocusFriends />
            </GridItem>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
