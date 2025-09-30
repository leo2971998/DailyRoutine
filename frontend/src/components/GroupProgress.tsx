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
  VStack
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
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            {data.group_name}
          </Text>
          <Text fontSize="sm" color="brand.900" opacity={0.72}>
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

const ChallengeCard = ({ progressValue, data }: ChallengeCardProps) => (
  <Stack spacing={4} bg="rgba(255, 255, 255, 0.75)" borderRadius="20px" p={4}>
    <HStack spacing={3} align="flex-start">
      <IconBadge icon={FiFlag} />
      <Stack spacing={1} flex="1">
        <Text fontSize="sm" fontWeight="semibold" color="brand.700">
          Shared Challenge
        </Text>
        <Text fontSize="lg" fontWeight="bold" color="brand.900">
          {data.challenge.title}
        </Text>
        <Text fontSize="xs" color="brand.600">
          {data.challenge.timeframe} • {data.challenge.current} / {data.challenge.goal} {data.challenge.unit}
        </Text>
      </Stack>
    </HStack>
    <Progress value={progressValue} size="md" borderRadius="full" colorScheme="orange" bg="rgba(254, 215, 170, 0.6)" />
  </Stack>
);

interface LeaderboardProps {
  members: GroupMember[];
  challenge: GroupProgressType['challenge'];
}

const Leaderboard = ({ members, challenge }: LeaderboardProps) => (
  <Stack spacing={3}>
    <HStack justify="space-between">
      <HStack spacing={2}>
        <FiAward color="var(--chakra-colors-brand-600)" />
        <Text fontSize="sm" fontWeight="semibold" color="brand.700">
          Team Leaderboard
        </Text>
      </HStack>
      <Badge borderRadius="12px" px={3} py={1} bg="rgba(251, 191, 36, 0.2)" color="brand.700">
        {challenge.timeframe}
      </Badge>
    </HStack>
    <VStack align="stretch" spacing={3}>
      {members.map((member, index) => (
        <Flex
          key={member.id}
          align="center"
          justify="space-between"
          bg="rgba(255, 255, 255, 0.78)"
          borderRadius="16px"
          px={4}
          py={3}
        >
          <HStack spacing={3}>
            <Badge
              borderRadius="10px"
              px={2}
              py={1}
              fontSize="xs"
              bg="rgba(251, 191, 36, 0.25)"
              color="brand.700"
              minW="32px"
              textAlign="center"
            >
              #{index + 1}
            </Badge>
            <Avatar name={member.name} bg={member.avatar_color} color="white" size="sm" />
            <Stack spacing={0}>
              <Text fontSize="sm" fontWeight="semibold" color="brand.800">
                {member.name}
              </Text>
              <Text fontSize="xs" color="brand.600">
                {member.progress} {challenge.unit} • {member.streak}-day streak
              </Text>
            </Stack>
          </HStack>
          <Badge borderRadius="full" px={3} py={1} bg="rgba(251, 191, 36, 0.25)" color="brand.700">
            +1 today
          </Badge>
        </Flex>
      ))}
    </VStack>
  </Stack>
);

interface ActivityFeedProps {
  entries: ActivityEntry[];
  reactionOptions: GroupProgressType['reaction_options'];
  members: GroupMember[];
}

const ActivityFeed = ({ entries, reactionOptions, members }: ActivityFeedProps) => {
  const memberMap = new Map(members.map((member) => [member.id, member]));

  return (
    <Stack spacing={3}>
      <HStack spacing={2}>
        <FiZap color="var(--chakra-colors-brand-600)" />
        <Text fontSize="sm" fontWeight="semibold" color="brand.700">
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
              bg="rgba(255, 255, 255, 0.78)"
              borderRadius="16px"
              px={4}
              py={3}
            >
              <HStack justify="space-between" align="flex-start">
                <Stack spacing={1}>
                  <Text fontWeight="semibold" color="brand.800">
                    {member?.name ?? 'Anonymous adventurer'}
                  </Text>
                  <Text fontSize="xs" color="brand.600">
                    {dayjs(entry.timestamp).fromNow()}
                  </Text>
                  <Text fontSize="sm" color="brand.900" opacity={0.75}>
                    {entry.description}
                  </Text>
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
