import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiCalendar, FiSearch } from 'react-icons/fi';
import InsightsCard, { DailyInsightContent, MonthlyInsightContent } from '../InsightsCard';
import CardContainer from '../ui/CardContainer';
import { useDailyInsight, useMonthlyInsight } from '@/hooks/useInsights';
import { useDemoUser } from '@/hooks/useDemoUser';

const InsightsTab = () => {
  const { data: user } = useDemoUser();
  const [activeTab, setActiveTab] = useState(0);
  const [dailyDate, setDailyDate] = useState('');
  const [monthlyDate, setMonthlyDate] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);

  const {
    data: dailyInsight,
    isLoading: isDailyLoading,
    error: dailyError,
    refetch: refetchDaily
  } = useDailyInsight(user?._id || '', dailyDate || undefined, forceRefresh);

  const {
    data: monthlyInsight,
    isLoading: isMonthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly
  } = useMonthlyInsight(user?._id || '', monthlyDate || undefined, forceRefresh);

  const normalizedDailyError = (dailyError as Error | null | undefined) ?? null;
  const normalizedMonthlyError = (monthlyError as Error | null | undefined) ?? null;

  const tabListBg = useColorModeValue('rgba(255, 255, 255, 0.88)', 'whiteAlpha.100');
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

  const inputBg = useColorModeValue('white', 'whiteAlpha.200');
  const inputBorder = useColorModeValue('rgba(15, 23, 42, 0.06)', 'rgba(255, 255, 255, 0.12)');
  const searchIconColor = useColorModeValue('brand.500', 'brand.300');

  const handleRefresh = () => {
    setForceRefresh(true);
    if (activeTab === 0) {
      refetchDaily();
    } else {
      refetchMonthly();
    }
    // Reset force refresh after a short delay
    setTimeout(() => setForceRefresh(false), 1000);
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (!user) {
    return (
      <Box textAlign="center" py={20}>
        <Text color="text.muted">Please log in to view insights</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="text.primary" textAlign="center">
          AI Insights
        </Text>
        <Text fontSize="md" color="text.secondary" textAlign="center" maxW="2xl" mx="auto">
          Get personalized insights and recommendations powered by AI analysis of your daily routine data
        </Text>
      </VStack>

      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        variant="soft-rounded"
        colorScheme="orange"
        display="flex"
        flexDirection="column"
        gap={6}
      >
        <TabList bg={tabListBg} borderRadius="18px" p={2} overflowX="auto">
          <Tab
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
          >
            <Icon as={FiCalendar} />
            Daily Insights
          </Tab>
          <Tab
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
          >
            <Icon as={FiSearch} />
            Monthly Insights
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
              <GridItem colSpan={{ base: 1, lg: 1 }}>
                <CardContainer surface="translucent">
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="lg" fontWeight="semibold" color="text.primary">
                      Daily Insight Settings
                    </Text>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={2}>
                        Date (optional)
                      </Text>
                      <Input
                        type="date"
                        value={dailyDate}
                        onChange={(e) => setDailyDate(e.target.value)}
                        placeholder={getCurrentDate()}
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)' }}
                      />
                      <Text fontSize="xs" color="text.muted" mt={1}>
                        Leave empty for today's insights
                      </Text>
                    </Box>
                    <Button
                      colorScheme="brand"
                      onClick={handleRefresh}
                      isLoading={isDailyLoading}
                      loadingText="Generating..."
                    >
                      Generate Daily Insight
                    </Button>
                  </VStack>
                </CardContainer>
              </GridItem>
              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <InsightsCard
                  title="Today's AI Insights"
                  isLoading={isDailyLoading}
                  error={normalizedDailyError}
                  onRefresh={handleRefresh}
                >
                  {dailyInsight && <DailyInsightContent insight={dailyInsight} />}
                </InsightsCard>
              </GridItem>
            </Grid>
          </TabPanel>

          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
              <GridItem colSpan={{ base: 1, lg: 1 }}>
                <CardContainer surface="translucent">
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="lg" fontWeight="semibold" color="text.primary">
                      Monthly Insight Settings
                    </Text>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={2}>
                        Month (optional)
                      </Text>
                      <Input
                        type="month"
                        value={monthlyDate}
                        onChange={(e) => setMonthlyDate(e.target.value)}
                        placeholder={getCurrentMonth()}
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)' }}
                      />
                      <Text fontSize="xs" color="text.muted" mt={1}>
                        Leave empty for current month's insights
                      </Text>
                    </Box>
                    <Button
                      colorScheme="brand"
                      onClick={handleRefresh}
                      isLoading={isMonthlyLoading}
                      loadingText="Generating..."
                    >
                      Generate Monthly Insight
                    </Button>
                  </VStack>
                </CardContainer>
              </GridItem>
              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <InsightsCard
                  title="Monthly AI Insights"
                  isLoading={isMonthlyLoading}
                  error={normalizedMonthlyError}
                  onRefresh={handleRefresh}
                >
                  {monthlyInsight && <MonthlyInsightContent insight={monthlyInsight} />}
                </InsightsCard>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  );
};

export default InsightsTab;
