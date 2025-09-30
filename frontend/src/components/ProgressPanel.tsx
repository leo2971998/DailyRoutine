import {
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
import { IconType } from 'react-icons';
import { FiHeart, FiZap } from 'react-icons/fi';
import { ProgressSnapshot } from '../api/types';
import CardContainer from './ui/CardContainer';

interface ProgressPanelProps {
  progress: ProgressSnapshot;
}

const ProgressPanel = ({ progress }: ProgressPanelProps) => {
  const track = useColorModeValue('rgba(255, 255, 255, 0.55)', 'gray.700');
  const dividerColor = useColorModeValue('rgba(250, 204, 21, 0.45)', 'whiteAlpha.200');
  const completionRate = computeCompletion(progress);

  return (
    <CardContainer surface="translucent" h="100%">
      <Stack spacing={6} h="100%" justify="space-between" position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            Progress Pulse
          </Text>
          <Text fontSize="sm" color="brand.900" opacity={0.7}>
            Snapshot of your completion energy today.
          </Text>
        </Stack>

        <CircularProgress value={completionRate} size="180px" thickness="12px" color="brand.500" trackColor={track}>
          <CircularProgressLabel>
            <Stack spacing={1} align="center">
              <Text fontSize="2xl" fontWeight="semibold" color="brand.800">
                {completionRate}%
              </Text>
              <Text fontSize="sm" color="brand.900" opacity={0.7}>
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
    </CardContainer>
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
      <Icon as={icon} boxSize={8} color="brand.500" />
      <Stack spacing={0}>
        <StatLabel fontSize="sm" color="brand.900" opacity={0.7}>
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl">{value}</StatNumber>
        <StatHelpText color="brand.600">{delta}</StatHelpText>
      </Stack>
    </HStack>
  </Stat>
);

const computeCompletion = (progress: ProgressSnapshot) => {
  const total = progress.tasks_total + progress.habits_total;
  if (!total) return 0;
  return Math.round(((progress.tasks_completed + progress.habits_completed) / total) * 100);
};

export default ProgressPanel;
