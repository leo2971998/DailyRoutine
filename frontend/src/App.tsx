import {
  Box,
  Container,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiCalendar, FiGrid, FiHeart, FiSearch, FiTarget } from 'react-icons/fi';
import { useDashboard } from './hooks/useDashboard';
import HabitsTab from './components/tabs/HabitsTab';
import OverviewTab from './components/tabs/OverviewTab';
import ScheduleTab from './components/tabs/ScheduleTab';
import SocialTab from './components/tabs/SocialTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'habits', label: 'Habits & Log', icon: FiTarget },
  { id: 'schedule', label: 'Schedule', icon: FiCalendar },
  { id: 'together', label: 'Together', icon: FiHeart }
] as const;

function App() {
  const { data, isLoading } = useDashboard();
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading || !data) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#141012">
        <Spinner size="xl" color="brand.200" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bgGradient="linear(to-br, #141012, #251310)" position="relative" overflow="hidden" py={{ base: 6, md: 10 }}>
      <Box
        position="absolute"
        inset={0}
        opacity={0.32}
        backgroundImage="radial-gradient(circle at 15% 20%, rgba(249, 115, 22, 0.32), transparent 55%), radial-gradient(circle at 80% 8%, rgba(253, 186, 116, 0.25), transparent 55%)"
      />
      <Container maxW="7xl" px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
        <Stack spacing={{ base: 6, lg: 10 }}>
          <Flex
            bg="rgba(255, 247, 237, 0.95)"
            borderRadius="24px"
            boxShadow="0 24px 60px rgba(0, 0, 0, 0.25)"
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

            <InputGroup maxW="260px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="brand.500" />
              </InputLeftElement>
              <Input
                placeholder="Search journeys"
                bg="rgba(255, 255, 255, 0.95)"
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
          </Flex>

          <Tabs
            index={activeTab}
            onChange={setActiveTab}
            variant="soft-rounded"
            colorScheme="orange"
            display="flex"
            flexDirection="column"
            gap={6}
          >
            <TabList bg="rgba(255, 247, 237, 0.12)" borderRadius="18px" p={2} overflowX="auto">
              {TABS.map((tab, index) => (
                <Tab
                  key={tab.id}
                  borderRadius="14px"
                  fontWeight="semibold"
                  color="warmGray.300"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  _selected={{
                    bg: 'brand.400',
                    color: 'white',
                    boxShadow: '0 10px 24px rgba(251, 146, 60, 0.35)'
                  }}
                  whiteSpace="nowrap"
                  fontSize="sm"
                  data-active={activeTab === index}
                >
                  <Icon as={tab.icon} />
                  {tab.label}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <OverviewTab data={data} />
              </TabPanel>
              <TabPanel px={0}>
                <HabitsTab data={data} />
              </TabPanel>
              <TabPanel px={0}>
                <ScheduleTab data={data} />
              </TabPanel>
              <TabPanel px={0}>
                <SocialTab data={data} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
