import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Stack,
  Text,
  useBreakpointValue
} from '@chakra-ui/react';
import { FiCompass, FiGrid, FiSearch, FiUser } from 'react-icons/fi';
import { useDashboard } from './hooks/useDashboard';
import GreetingCard from './components/GreetingCard';
import ChecklistCard from './components/ChecklistCard';
import ScheduleCard from './components/ScheduleCard';
import HabitBoard from './components/HabitBoard';
import ProgressPanel from './components/ProgressPanel';
import GroupProgress from './components/GroupProgress';
import DailyLogCard from './components/DailyLogCard';

const navItems = [
  { label: 'Overview', icon: FiGrid },
  { label: 'Journeys', icon: FiCompass },
  { label: 'Friends', icon: FiUser }
];

function App() {
  const { data, isLoading } = useDashboard();
  const layout = useBreakpointValue<'column' | 'row'>({ base: 'column', lg: 'row' });

  if (isLoading || !data) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#141012">
        <Spinner size="xl" color="brand.200" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, #141012, #251310)"
      position="relative"
      overflow="hidden"
      py={{ base: 6, md: 10 }}
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.3}
        backgroundImage="radial-gradient(circle at 15% 20%, rgba(249, 115, 22, 0.35), transparent 55%), radial-gradient(circle at 85% 10%, rgba(250, 204, 21, 0.25), transparent 50%), radial-gradient(circle at 30% 85%, rgba(234, 88, 12, 0.28), transparent 60%)"
      />
      <Container maxW="7xl" px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
        <Stack spacing={{ base: 6, lg: 10 }}>
          <Flex
            bgGradient="linear(to-br, rgba(255, 247, 237, 0.96), rgba(254, 215, 170, 0.92))"
            borderRadius="24px"
            boxShadow="0 24px 60px rgba(0, 0, 0, 0.35)"
            px={{ base: 4, md: 6 }}
            py={4}
            align="center"
            justify="space-between"
            flexWrap="wrap"
            gap={4}
          >
            <HStack spacing={3}>
              <Box
                w="44px"
                h="44px"
                borderRadius="16px"
                bgGradient="linear(to-br, brand.400, brand.600)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
                fontSize="lg"
              >
                DR
              </Box>
              <Stack spacing={0}>
                <Text fontWeight="semibold" color="brand.800">
                  DailyRoutine Adventures
                </Text>
                <Text fontSize="xs" color="brand.700" opacity={0.7}>
                  Plan your warmest journeys
                </Text>
              </Stack>
            </HStack>

            <HStack spacing={3} flexWrap="wrap">
              {navItems.map((item) => (
                <HStack
                  key={item.label}
                  spacing={2}
                  px={3}
                  py={2}
                  borderRadius="16px"
                  bg="rgba(251, 191, 36, 0.18)"
                  color="brand.700"
                >
                  <Icon as={item.icon} />
                  <Text fontSize="sm" fontWeight="medium">
                    {item.label}
                  </Text>
                </HStack>
              ))}
            </HStack>

            <HStack spacing={4}>
              <InputGroup maxW="260px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="brand.500" />
                </InputLeftElement>
                <Input
                  placeholder="Search journeys"
                  bg="rgba(255, 255, 255, 0.9)"
                  borderRadius="16px"
                  borderColor="transparent"
                  _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)' }}
                />
              </InputGroup>
              <Box
                w="48px"
                h="48px"
                borderRadius="18px"
                bgGradient="linear(to-br, brand.400, brand.600)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
              >
                {data.user
                  .split(' ')
                  .map((name) => name[0])
                  .join('')
                  .slice(0, 2)}
              </Box>
            </HStack>
          </Flex>

          <Flex direction={{ base: 'column', xl: 'row' }} gap={{ base: 6, xl: 8 }}>
            <Stack flex="1" spacing={{ base: 6, lg: 8 }}>
              <Grid
                templateColumns={{ base: '1fr', lg: 'repeat(5, 1fr)' }}
                gap={{ base: 6, lg: 8 }}
                alignItems="stretch"
              >
                <GridItem colSpan={{ base: 1, lg: 3 }}>
                  <GreetingCard state={data} />
                </GridItem>
                <GridItem colSpan={{ base: 1, lg: 2 }}>
                  <ProgressPanel progress={data.progress} />
                </GridItem>
              </Grid>

              <Grid
                templateColumns={{ base: '1fr', lg: 'repeat(5, 1fr)' }}
                gap={{ base: 6, lg: 8 }}
                alignItems="stretch"
              >
                <GridItem colSpan={{ base: 1, lg: 3 }}>
                  <ChecklistCard checklist={data.checklist} />
                </GridItem>
                <GridItem colSpan={{ base: 1, lg: 2 }}>
                  <Stack spacing={{ base: 6, md: 8 }}>
                    <ScheduleCard schedule={data.schedule} layout={layout ?? 'column'} />
                    <DailyLogCard log={data.daily_log} checklist={data.checklist} />
                  </Stack>
                </GridItem>
              </Grid>

              <HabitBoard habits={data.habits} />
            </Stack>

            <Box flexBasis={{ base: '100%', xl: '320px' }}>
              <GroupProgress data={data.group_progress} />
            </Box>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
