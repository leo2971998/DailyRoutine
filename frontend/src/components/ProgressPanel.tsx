import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  HStack,
  Icon,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { FiHeart, FiZap } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { ProgressSnapshot } from '../api/types';

interface ProgressPanelProps {
  progress: ProgressSnapshot;
}

const ProgressPanel = ({ progress }: ProgressPanelProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');
  const track = useColorModeValue('gray.100', 'gray.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.200');
  const completionRate = computeCompletion(progress);

  return (
    <Box
      bg={cardBg}
      borderRadius="28px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 6, md: 8 }}
      boxShadow="xl"
      h="100%"
    >
      <Stack spacing={6} h="100%" justify="space-between">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            Progress Pulse
          </Text>
          <Text fontSize="sm" color="gray.500">
            Snapshot of your completion energy today.
          </Text>
        </Stack>

        <CircularProgress
          value={completionRate}
          size="180px"
          thickness="12px"
          color="purple.400"
          trackColor={track}
        >
          <CircularProgressLabel>
            <Stack spacing={1} align="center">
              <Text fontSize="2xl" fontWeight="semibold">
                {completionRate}%
              </Text>
              <Text fontSize="sm" color="gray.500">
                Completion
              </Text>
            </Stack>
          </CircularProgressLabel>
        </CircularProgress>

        <Stack spacing={4} divider={<Divider borderColor={dividerColor} />}>
          <StatRow
            icon={FiZap}
            label="Checklist"
            value={`${progress.tasks_completed} / ${progress.tasks_total}`}
            delta="+12% vs yesterday"
          />
          <StatRow
            icon={FiHeart}
            label="Habits"
            value={`${progress.habits_completed} / ${progress.habits_total}`}
            delta="Steady streak"
          />
        </Stack>
      </Stack>
    </Box>
  );
};

interface StatRowProps {
  icon: IconType;
  label: string;
  value: string;
  delta: string;
}

const StatRow = ({ icon, label, value, delta }: StatRowProps) => (
  <Stat>
    <HStack spacing={4} align="flex-start">
      <Icon as={icon} boxSize={8} color="purple.400" />
      <Stack spacing={0}>
        <StatLabel fontSize="sm" color="gray.500">
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl">{value}</StatNumber>
        <StatHelpText color="green.400">{delta}</StatHelpText>
      </Stack>
    </HStack>
  </Stat>
);

const computeCompletion = (progress: ProgressSnapshot) => {
  const total = progress.tasks_total + progress.habits_total;
  if (!total) return 0;
  return Math.round(
    ((progress.tasks_completed + progress.habits_completed) / total) * 100
  );
};

export default ProgressPanel;
