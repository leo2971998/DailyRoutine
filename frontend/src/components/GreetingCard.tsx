import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text
} from '@chakra-ui/react';
import { FiChevronRight, FiSun, FiTrendingUp } from 'react-icons/fi';
import { DashboardState } from '../api/types';
import dayjs from 'dayjs';

interface GreetingCardProps {
  state: DashboardState;
}

const quickActions = ['Today', 'Week', 'Custom'];

const GreetingCard = ({ state }: GreetingCardProps) => {
  const formattedDate = dayjs(state.date).format('dddd, D MMMM YYYY');

  return (
    <Box
      bgGradient="linear(to-r, #282a36, #3b82f6)"
      color="white"
      borderRadius="32px"
      p={{ base: 6, md: 10 }}
      position="relative"
      overflow="hidden"
      minH="320px"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.25}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'white\' stroke-width=\'0.5\' opacity=\'0.5\'%3E%3Cpath d=\'M0 50h400M0 100h400M0 150h400M0 200h400M0 250h400M0 300h400M0 350h400M50 0v400M100 0v400M150 0v400M200 0v400M250 0v400M300 0v400M350 0v400\'/%3E%3C/g%3E%3C/svg%3E')"
      />

      <Stack spacing={8} position="relative">
        <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={6}>
          <Stack spacing={3} maxW="lg">
            <HStack color="orange.200" fontWeight="semibold">
              <Icon as={FiTrendingUp} />
              <Text textTransform="uppercase" fontSize="xs" letterSpacing="0.3em">
                Daily momentum
              </Text>
            </HStack>
            <Heading size="xl" fontWeight="semibold">
              {state.greeting}
            </Heading>
            <HStack fontSize="md" color="whiteAlpha.800">
              <Icon as={FiSun} />
              <Text>{formattedDate}</Text>
            </HStack>
          </Stack>

          <Avatar
            name={state.user}
            size={{ base: 'lg', md: 'xl' }}
            bg="white"
            color="gray.800"
            fontWeight="bold"
          />
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} maxW="xl">
          <StatCard label="Tasks" value={`${state.progress.tasks_completed}/${state.progress.tasks_total}`} />
          <StatCard label="Habits" value={`${state.progress.habits_completed}/${state.progress.habits_total}`} />
          <StatCard label="Focus score" value={calculateFocusScore(state.progress)} />
        </SimpleGrid>

        <ButtonGroup size="sm" variant="solid" colorScheme="blackAlpha">
          {quickActions.map((action) => (
            <Button
              key={action}
              borderRadius="full"
              bg="whiteAlpha.200"
              _hover={{ bg: 'whiteAlpha.300' }}
              rightIcon={<FiChevronRight />}
            >
              {action}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>
    </Box>
  );
};

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <Stack
    spacing={1}
    bg="whiteAlpha.200"
    borderRadius="24px"
    p={4}
    backdropFilter="blur(10px)"
  >
    <Text fontSize="sm" color="whiteAlpha.800">
      {label}
    </Text>
    <Heading size="lg">{value}</Heading>
  </Stack>
);

const calculateFocusScore = (progress: DashboardState['progress']) => {
  const total = progress.tasks_total + progress.habits_total;
  if (!total) return '—';
  const score = Math.round(
    ((progress.tasks_completed + progress.habits_completed) / total) * 100
  );
  return `${score}%`;
};

export default GreetingCard;
