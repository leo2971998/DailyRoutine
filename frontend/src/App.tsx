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
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { FiCalendar, FiGrid, FiHeart, FiSearch, FiTarget } from 'react-icons/fi';
import OverviewTab from './components/tabs/OverviewTab';
import HabitsTab from './components/tabs/HabitsTab';
import ScheduleTab from './components/tabs/ScheduleTab';
import SocialTab from './components/tabs/SocialTab';
import { useDemoUser } from '@/hooks/useDemoUser';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'habits', label: 'Habits & Log', icon: FiTarget },
  { id: 'schedule', label: 'Schedule', icon: FiCalendar },
  { id: 'together', label: 'Together', icon: FiHeart }
] as const;

function App() {
  const { data: user, isLoading: isUserLoading } = useDemoUser();
  const { data: incompleteTasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: habits = [], isLoading: isHabitsLoading } = useHabits();
  const [activeTab, setActiveTab] = useState(0);
  const loadingBg = useColorModeValue('bg.primary', 'bg.dark');
  const spinnerColor = useColorModeValue('brand.500', 'brand.200');
  const pageBackground = 'bg.gradient';
  const pageOverlay = useColorModeValue(
    "radial-gradient(circle at 15% 20%, rgba(234, 88, 12, 0.18), transparent 55%), radial-gradient(circle at 80% 8%, rgba(253, 186, 116, 0.2), transparent 55%)",
    "radial-gradient(circle at 20% 25%, rgba(234, 88, 12, 0.25), transparent 55%), radial-gradient(circle at 78% 12%, rgba(249, 115, 22, 0.2), transparent 55%)"
  );
  const heroBackground = useColorModeValue('rgba(255, 255, 255, 0.92)', 'whiteAlpha.100');
  const heroBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const heroSubtitle = useColorModeValue('text.secondary', 'text.inverse');
  const inputBackground = useColorModeValue('white', 'whiteAlpha.200');
  const inputBorder = useColorModeValue('rgba(15, 23, 42, 0.06)', 'rgba(255, 255, 255, 0.12)');
  const searchIconColor = useColorModeValue('brand.500', 'brand.300');
  const tabListBackground = useColorModeValue('rgba(255, 255, 255, 0.88)', 'whiteAlpha.100');
  const tabColor = useColorModeValue('text.muted', 'whiteAlpha.800');
  const selectedTabStyles = useColorModeValue(
    {
      bg: 'brand.500',
      color: 'text.onAccent',
      boxShadow: '0 10px 24px rgba(249, 115, 22, 0.28)'
    },
    {
      bg: 'brand.500',
      color: 'text.onAccent',
      boxShadow: '0 12px 28px rgba(249, 115, 22, 0.45)'
    }
  );

  const isLoading = isUserLoading && !user;

  const initials = useMemo(() => {
    if (!user?.name) return 'DR';
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={loadingBg}>
        <Spinner size="xl" color={spinnerColor} thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={pageBackground} position="relative" overflow="hidden" py={{ base: 6, md: 10 }}>
      <Box
        position="absolute"
        inset={0}
        opacity={0.32}
        backgroundImage={pageOverlay}
      />
      <Container maxW="7xl" px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
        <Stack spacing={{ base: 6, lg: 10 }}>
          <Flex
            bg={heroBackground}
            borderRadius="24px"
            boxShadow="shadow.card"
            px={{ base: 4, md: 6 }}
            py={4}
            borderWidth={1}
            borderColor={heroBorder}
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
                <Text fontWeight="semibold" color="text.primary">
                  DailyRoutine Adventures
                </Text>
                <Text fontSize="xs" color={heroSubtitle}>
                  Plan your warmest journeys
                </Text>
              </Stack>
            </HStack>

            <InputGroup maxW="260px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color={searchIconColor} />
              </InputLeftElement>
              <Input
                placeholder="Search journeys"
                bg={inputBackground}
                borderRadius="16px"
                borderColor={inputBorder}
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
              {initials}
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
            <TabList bg={tabListBackground} borderRadius="18px" p={2} overflowX="auto">
              {TABS.map((tab, index) => (
                <Tab
                  key={tab.id}
                  borderRadius="14px"
                  fontWeight="semibold"
                  color={tabColor}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  _selected={selectedTabStyles}
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
                <OverviewTab
                  user={user}
                  isTasksLoading={isTasksLoading}
                  isHabitsLoading={isHabitsLoading}
                  tasks={incompleteTasks}
                  habits={habits}
                />
              </TabPanel>
              <TabPanel px={0}>
                <HabitsTab />
              </TabPanel>
              <TabPanel px={0}>
                <ScheduleTab />
              </TabPanel>
              <TabPanel px={0}>
                <SocialTab />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
