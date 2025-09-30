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
  const track = useColorModeValue('rgba(253, 224, 71, 0.45)', 'rgba(148, 163, 184, 0.35)');
  const dividerColor = 'border.subtle';
  const completionRate = computeCompletion(progress);

  return (
    <CardContainer surface="translucent" h="100%">
      <Stack spacing={6} h="100%" justify="space-between" position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Progress Pulse
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Snapshot of your completion energy today.
          </Text>
        </Stack>

        <CircularProgress value={completionRate} size="180px" thickness="12px" color="text.accent" trackColor={track}>
          <CircularProgressLabel>
            <Stack spacing={1} align="center">
              <Text fontSize="2xl" fontWeight="semibold" color="text.primary">
                {completionRate}%
              </Text>
              <Text fontSize="sm" color="text.secondary">
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

const StatRow = ({ icon, label, value, delta }: StatRowProps) => {
  const iconColor = 'text.accent';
  const labelColor = useColorModeValue('text.secondary', 'text.muted');
  const helpColor = 'text.muted';

  return (
    <Stat>
      <HStack spacing={4} align="flex-start">
        <Icon as={icon} boxSize={8} color={iconColor} />
        <Stack spacing={0}>
          <StatLabel fontSize="sm" color={labelColor}>
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" color="text.primary">
            {value}
          </StatNumber>
          <StatHelpText color={helpColor}>{delta}</StatHelpText>
        </Stack>
      </HStack>
    </Stat>
  );
};

const computeCompletion = (progress: ProgressSnapshot) => {
  const total = progress.tasks_total + progress.habits_total;
  if (!total) return 0;
  return Math.round(((progress.tasks_completed + progress.habits_completed) / total) * 100);
};

export default ProgressPanel;
