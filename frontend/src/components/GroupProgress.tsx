import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Progress,
  Stack,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import dayjs from '../utils/dayjs';
import { FiAward, FiFlag, FiZap } from 'react-icons/fi';
import { ActivityEntry, GroupMember, GroupProgress as GroupProgressType } from '../api/types';
import CardContainer from './ui/CardContainer';
import IconBadge from './ui/IconBadge';

interface GroupProgressProps {
  data: GroupProgressType;
}

const GroupProgress = ({ data }: GroupProgressProps) => {
  const progressValue = Math.min(100, Math.round((data.challenge.current / data.challenge.goal) * 100));

  return (
    <CardContainer surface="translucent" h="100%">
      <Stack spacing={6} position="relative" zIndex={1} h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            {data.group_name}
          </Text>
          <Text fontSize="sm" color="text.secondary">
            {data.mission}
          </Text>
        </Stack>

        <ChallengeCard progressValue={progressValue} data={data} />

        <Stack spacing={4} flex="1" justify="space-between">
          <Leaderboard members={data.leaderboard} challenge={data.challenge} />
          <ActivityFeed entries={data.activity_feed} reactionOptions={data.reaction_options} members={data.leaderboard} />
        </Stack>
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.18}
        backgroundImage="radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.18), transparent 50%), radial-gradient(circle at 82% 16%, rgba(253, 186, 116, 0.18), transparent 55%)"
        pointerEvents="none"
      />
    </CardContainer>
  );
};

interface ChallengeCardProps {
  progressValue: number;
  data: GroupProgressType;
}

const ChallengeCard = ({ progressValue, data }: ChallengeCardProps) => {
  const cardBg = useColorModeValue('bg.secondary', 'whiteAlpha.100');
  const borderColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const labelColor = useColorModeValue('text.secondary', 'text.muted');
  const valueColor = useColorModeValue('text.primary', 'text.inverse');
  const metaColor = useColorModeValue('text.muted', 'text.muted');
  const trackBg = useColorModeValue('rgba(253, 224, 71, 0.45)', 'rgba(248, 113, 113, 0.3)');

  return (
    <Stack spacing={4} bg={cardBg} borderRadius="20px" p={4} borderWidth="1px" borderColor={borderColor}>
      <HStack spacing={3} align="flex-start">
        <IconBadge icon={FiFlag} />
        <Stack spacing={1} flex="1">
          <Text fontSize="sm" fontWeight="semibold" color={labelColor}>
            Shared Challenge
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={valueColor}>
            {data.challenge.title}
          </Text>
          <Text fontSize="xs" color={metaColor}>
            {data.challenge.timeframe} • {data.challenge.current} / {data.challenge.goal} {data.challenge.unit}
          </Text>
        </Stack>
      </HStack>
      <Progress value={progressValue} size="md" borderRadius="full" colorScheme="orange" bg={trackBg} />
    </Stack>
  );
};

interface LeaderboardProps {
  members: GroupMember[];
  challenge: GroupProgressType['challenge'];
}

const Leaderboard = ({ members, challenge }: LeaderboardProps) => {
  const awardColor = useColorModeValue('#dc2626', '#fb923c');
  const headerColor = useColorModeValue('text.secondary', 'text.muted');
  const badgeBg = useColorModeValue('rgba(253, 224, 71, 0.25)', 'rgba(248, 113, 113, 0.25)');
  const badgeColor = useColorModeValue('brand.600', 'brand.200');
  const rowBg = useColorModeValue('bg.primary', 'whiteAlpha.100');
  const rowBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const nameColor = useColorModeValue('text.primary', 'text.inverse');
  const subTextColor = useColorModeValue('text.muted', 'text.muted');

  return (
    <Stack spacing={3}>
      <HStack justify="space-between">
        <HStack spacing={2}>
          <FiAward color={awardColor} />
          <Text fontSize="sm" fontWeight="semibold" color={headerColor}>
            Team Leaderboard
          </Text>
        </HStack>
        <Badge borderRadius="12px" px={3} py={1} bg={badgeBg} color={badgeColor}>
          {challenge.timeframe}
        </Badge>
      </HStack>
      <VStack align="stretch" spacing={3}>
        {members.map((member, index) => (
          <Flex
            key={member.id}
            align="center"
            justify="space-between"
            bg={rowBg}
            borderRadius="16px"
            px={4}
            py={3}
            borderWidth="1px"
            borderColor={rowBorder}
          >
            <HStack spacing={3}>
              <Badge
                borderRadius="10px"
                px={2}
                py={1}
                fontSize="xs"
                bg={badgeBg}
                color={badgeColor}
                minW="32px"
                textAlign="center"
              >
                #{index + 1}
              </Badge>
              <Avatar name={member.name} bg={member.avatar_color} color="white" size="sm" />
              <Stack spacing={0}>
                <Text fontSize="sm" fontWeight="semibold" color={nameColor}>
                  {member.name}
                </Text>
                <Text fontSize="xs" color={subTextColor}>
                  {member.progress} {challenge.unit} • {member.streak}-day streak
                </Text>
              </Stack>
            </HStack>
            <Badge borderRadius="full" px={3} py={1} bg={badgeBg} color={badgeColor}>
              +1 today
            </Badge>
          </Flex>
        ))}
      </VStack>
    </Stack>
  );
};

interface ActivityFeedProps {
  entries: ActivityEntry[];
  reactionOptions: GroupProgressType['reaction_options'];
  members: GroupMember[];
}

const ActivityFeed = ({ entries, reactionOptions, members }: ActivityFeedProps) => {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const zapColor = useColorModeValue('#dc2626', '#fb923c');
  const headerColor = useColorModeValue('text.secondary', 'text.muted');
  const cardBg = useColorModeValue('bg.primary', 'whiteAlpha.100');
  const cardBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const nameColor = useColorModeValue('text.primary', 'text.inverse');
  const metaColor = useColorModeValue('text.muted', 'text.muted');
  const descriptionColor = useColorModeValue('text.secondary', 'text.muted');
  const detailColor = useColorModeValue('text.muted', 'text.muted');

  return (
    <Stack spacing={3}>
      <HStack spacing={2}>
        <FiZap color={zapColor} />
        <Text fontSize="sm" fontWeight="semibold" color={headerColor}>
          Live Activity Pulse
        </Text>
      </HStack>
      <VStack align="stretch" spacing={3}>
        {entries.map((entry) => {
          const member = memberMap.get(entry.member_id);
          return (
            <Stack
              key={entry.id}
              spacing={3}
              bg={cardBg}
              borderRadius="16px"
              px={4}
              py={3}
              borderWidth="1px"
              borderColor={cardBorder}
            >
              <HStack justify="space-between" align="flex-start">
                <Stack spacing={1}>
                  <Text fontWeight="semibold" color={nameColor}>
                    {member?.name ?? 'Anonymous adventurer'}
                  </Text>
                  <Text fontSize="xs" color={metaColor}>
                    {dayjs(entry.timestamp).fromNow()}
                  </Text>
                  <Text fontSize="sm" color={descriptionColor}>
                    {entry.summary}
                  </Text>
                  {entry.highlight && (
                    <Text fontSize="xs" color={detailColor}>
                      {entry.highlight}
                    </Text>
                  )}
                </Stack>
                <ButtonGroup size="sm" variant="ghost" colorScheme="orange">
                  {reactionOptions.map((reaction) => (
                    <Button key={reaction.id} borderRadius="full">
                      {reaction.emoji}
                    </Button>
                  ))}
                </ButtonGroup>
              </HStack>
            </Stack>
          );
        })}
      </VStack>
    </Stack>
  );
};

export default GroupProgress;
