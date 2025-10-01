import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { FiChevronRight, FiMap, FiSun, FiTrendingUp } from 'react-icons/fi';
import type { ProgressSummary, User } from '@/types';

type GreetingCardProps = {
  user?: User;
  progress: ProgressSummary;
  isLoading: boolean;
};

const quickActions = ['Today', 'Week', 'Custom'];

const GreetingCard = ({ user, progress, isLoading }: GreetingCardProps) => {
  const formattedDate = useMemo(() => dayjs().format('dddd, D MMMM YYYY'), []);
  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    const name = user?.name?.split(' ')[0] ?? 'there';
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 18) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }, [user?.name]);

  const stats = [
    {
      label: 'Tasks',
      value: `${progress.tasks_completed}/${Math.max(progress.tasks_total, progress.tasks_completed)}`,
    },
    {
      label: 'Habits',
      value: `${progress.habits_completed}/${Math.max(progress.habits_total, progress.habits_completed)}`,
    },
    {
      label: 'Focus score',
      value: calculateFocusScore(progress),
    },
  ];

  return (
    <Box
      bgGradient="linear(to-br, rgba(251, 146, 60, 0.95), rgba(250, 204, 21, 0.9))"
      color="white"
      borderRadius="24px"
      p={{ base: 6, md: 10 }}
      position="relative"
      overflow="hidden"
      minH="340px"
      boxShadow="0 16px 48px rgba(194, 65, 12, 0.24)"
      transform="rotate(-0.8deg)"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.4}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'600\' height=\'400\' viewBox=\'0 0 600 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff7ed\' fill-opacity=\'0.45\'%3E%3Cpath d=\'M0 320c60-32 120-32 180 0s120 32 180 0 120-32 180 0 120 32 180 0v80H0z\'/%3E%3Cpath d=\'M-40 220c70-40 140-40 210 0s140 40 210 0 140-40 210 0 140 40 210 0v180H-40z\' opacity=\'0.4\'/%3E%3C/g%3E%3C/svg%3E')"
      />
      <Box
        position="absolute"
        inset={0}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'600\' height=\'400\' viewBox=\'0 0 600 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg stroke=\'rgba(255,255,255,0.25)\' stroke-width=\'1\' fill=\'none\'%3E%3Cpath d=\'M60 360l48-64 72 24 64-96 80 56 60-88 84 40 68-104 96 72\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/g%3E%3C/svg%3E')"
        opacity={0.3}
      />

      <Stack spacing={8} position="relative" transform="rotate(0.8deg)">
        <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={6}>
          <Stack spacing={3} maxW="lg">
            <HStack color="brand.100" fontWeight="semibold">
              <Icon as={FiTrendingUp} />
              <Text textTransform="uppercase" fontSize="xs" letterSpacing="0.3em">
                Daily momentum
              </Text>
            </HStack>
            <Heading size="xl" fontWeight="semibold">
              {isLoading ? <Skeleton height="32px" width="240px" /> : greeting}
            </Heading>
            <HStack fontSize="md" color="whiteAlpha.800">
              <Icon as={FiSun} />
              <Text>{formattedDate}</Text>
            </HStack>
          </Stack>

          <Box
            position="relative"
            w={{ base: '120px', md: '160px' }}
            h={{ base: '120px', md: '160px' }}
            borderRadius="36px"
            bg="rgba(255, 255, 255, 0.25)"
            boxShadow="0 18px 50px rgba(120, 53, 15, 0.35)"
            overflow="hidden"
          >
            <Box
              position="absolute"
              inset={0}
              backgroundImage="url('data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3ClinearGradient id=\'a\' x1=\'0%25\' x2=\'100%25\' y1=\'0%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' stop-color=\'%23fde68a\'/%3E%3Cstop offset=\'100%25\' stop-color=\'%23f97316\'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg fill=\'url(%23a)\'%3E%3Cpath d=\'M100 10c28 0 44 18 44 40 0 22-18 40-44 40s-44-18-44-40c0-22 16-40 44-40z\'/%3E%3Cpath d=\'M54 90c16-10 32-10 48 0s32 10 48 0 32-10 48 0v110H6V90c16-10 32-10 48 0z\'/%3E%3C/g%3E%3C/svg%3E')"
              backgroundSize="cover"
            />
            <Box
              position="absolute"
              bottom={4}
              left={4}
              right={4}
              bg="rgba(255, 247, 237, 0.85)"
              borderRadius="18px"
              px={4}
              py={2}
              color="brand.700"
              fontWeight="semibold"
              display="flex"
              alignItems="center"
              gap={2}
              fontSize="sm"
            >
              <Icon as={FiMap} />
              <Text noOfLines={1}>{user?.name ?? 'Daily Routine'}</Text>
            </Box>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} maxW="xl">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={isLoading ? undefined : stat.value} />
          ))}
        </SimpleGrid>

        <ButtonGroup size="sm" variant="solid" colorScheme="blackAlpha">
          {quickActions.map((action) => (
            <Button
              key={action}
              borderRadius="full"
              bg="rgba(255, 255, 255, 0.25)"
              color="white"
              backdropFilter="blur(6px)"
              _hover={{ bg: 'rgba(255, 255, 255, 0.35)' }}
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

type StatCardProps = {
  label: string;
  value?: string;
};

const StatCard = ({ label, value }: StatCardProps) => (
  <Stack spacing={1} bg="rgba(255, 247, 237, 0.35)" borderRadius="20px" p={4} backdropFilter="blur(10px)">
    <Text fontSize="sm" color="whiteAlpha.900" opacity={0.8}>
      {label}
    </Text>
    {value ? <Heading size="lg">{value}</Heading> : <Skeleton height="28px" width="120px" />}
  </Stack>
);

const calculateFocusScore = (progress: ProgressSummary) => {
  const total = progress.tasks_total + progress.habits_total;
  if (!total) return '—';
  const score = Math.round(
    ((progress.tasks_completed + progress.habits_completed) / total) * 100
  );
  return `${score}%`;
};

export default GreetingCard;
