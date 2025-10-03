import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  IconButton,
  Skeleton,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSchedule } from '@/hooks/useSchedule';
import AISidekick from './AISidekick';
import { api } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { ScheduleEvent } from '@/types';
import CardContainer from './ui/CardContainer';

dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);

type ScheduleCardProps = {
  layout: 'row' | 'column';
  userId?: string;
};

const ScheduleCard = ({ layout, userId = env.DEMO_USER_ID }: ScheduleCardProps) => {
  const { data: events = [], isLoading } = useSchedule(userId);
  const aiDisclosure = useDisclosure();
  const [activeEvent, setActiveEvent] = useState<ScheduleEvent | null>(null);
  const queryClient = useQueryClient();
  const apiBase = api.defaults.baseURL ?? env.API_URL;

  return (
    <CardContainer surface="muted" h="100%">
      <Stack spacing={4} h="100%" position="relative" zIndex={1}>
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            Upcoming Schedule
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Stay ready for the adventures ahead.
          </Text>
        </Stack>

        {isLoading ? (
          <Stack spacing={4}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} height="180px" borderRadius="22px" />
            ))}
          </Stack>
        ) : events.length === 0 ? (
          <Box
            borderRadius="18px"
            borderWidth="1px"
            borderColor="border.subtle"
            p={8}
            textAlign="center"
            bg="surface.cardMuted"
          >
            <Text fontWeight="semibold" color="text.primary">
              No events scheduled
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Create schedule events via the API to see them here.
            </Text>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {events.map((event, index) => (
              <EventCard
                key={event._id}
                event={event}
                layout={layout}
                index={index}
                onOpenSidekick={(selected) => {
                  setActiveEvent(selected);
                  aiDisclosure.onOpen();
                }}
              />
            ))}
          </VStack>
        )}
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.16}
        backgroundImage="radial-gradient(circle at 18% 22%, rgba(249, 115, 22, 0.18), transparent 60%)"
        pointerEvents="none"
      />
      {activeEvent && (
        <AISidekick
          isOpen={aiDisclosure.isOpen}
          onClose={() => {
            aiDisclosure.onClose();
            setActiveEvent(null);
          }}
          apiBase={apiBase}
          userId={activeEvent.user_id ?? env.DEMO_USER_ID}
          entityType="schedule"
          entityData={activeEvent}
          intent="schedule_optimize"
          onApply={async (patch) => {
            if (!activeEvent) {
              throw new Error('No event selected');
            }
            const endpoint = patch.endpoint.replace('{id}', activeEvent._id);
            await api.request({
              url: endpoint,
              method: patch.method,
              data: patch.body,
            });
            await queryClient.invalidateQueries({ queryKey: ['schedule'] });
          }}
        />
      )}
    </CardContainer>
  );
};

type EventCardProps = {
  event: ScheduleEvent;
  layout: 'row' | 'column';
  index: number;
  onOpenSidekick: (event: ScheduleEvent) => void;
};

const EventCard = ({ event, layout, index, onOpenSidekick }: EventCardProps) => {
  const accent = useColorModeValue('bg.secondary', 'whiteAlpha.100');
  const border = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const date = dayjs(event.start_time).format('ddd, MMM D • h:mm A');
  const duration = dayjs(event.end_time).diff(dayjs(event.start_time), 'minute');
  const rotation = index % 2 === 0 ? '-1deg' : '1deg';
  const eventBodyBg = useColorModeValue('bg.primary', 'whiteAlpha.100');
  const scenicBackground = useMemo(() => getScenicBackground(index), [index]);

  return (
    <Box
      bg={accent}
      borderRadius="22px"
      overflow="hidden"
      borderWidth="1px"
      borderColor={border}
      boxShadow="0 10px 28px rgba(217, 119, 6, 0.16)"
      transform={`rotate(${rotation})`}
      position="relative"
    >
      <IconButton
        aria-label="Improve event with AI"
        icon={<span role="img" aria-hidden="true">✨</span>}
        size="sm"
        variant="ghost"
        position="absolute"
        top={3}
        right={3}
        onClick={() => onOpenSidekick(event)}
        zIndex={2}
      />
      <Stack direction={layout} spacing={0} align="stretch">
        <Box
          flex={layout === 'row' ? '0 0 45%' : undefined}
          h={layout === 'row' ? 'auto' : '160px'}
          backgroundImage={scenicBackground}
          backgroundSize="cover"
          backgroundPosition="center"
          position="relative"
        >
          <Box
            position="absolute"
            top={4}
            left={4}
            bg="rgba(255, 247, 237, 0.85)"
            borderRadius="18px"
            px={3}
            py={1}
            color="text.primary"
            fontWeight="semibold"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.2em"
          >
            {date}
          </Box>
          <AvatarGroup max={3} size="sm" position="absolute" bottom={4} left={4} spacing="-0.5rem">
            {generateCompanions(event._id).map((companion) => (
              <Avatar key={companion.name} name={companion.name} bg={companion.color} color="white" borderRadius="14px" />
            ))}
          </AvatarGroup>
        </Box>
        <Stack spacing={3} p={5} justify="space-between" bg={eventBodyBg}>
          <Stack spacing={2}>
            <Badge alignSelf="flex-start" borderRadius="full" px={3} py={1} bg="rgba(251, 191, 36, 0.18)" color="brand.500">
              {dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}
            </Badge>
            <Text fontWeight="semibold" fontSize="lg" color="text.primary">
              {event.title}
            </Text>
            {event.description && (
              <Text fontSize="sm" color="text.secondary">
                {event.description}
              </Text>
            )}
          </Stack>
          <Text fontSize="xs" textTransform="uppercase" color="text.muted" letterSpacing="0.3em">
            {Math.max(Math.round(duration / 60), 1)}h session
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

const generateCompanions = (seed: string) => {
  const palette = ['brand.400', 'brand.500', 'brand.600'];
  const names = ['Sol Wanderer', 'Cedar Scout', 'Dawn Storyteller'];
  return names.map((name, index) => ({
    name: `${name.split(' ')[0]} ${seed.slice(0, 2).toUpperCase()}`,
    color: palette[index % palette.length],
  }));
};

const getScenicBackground = (index: number) => {
  const palette = index % 2 === 0 ? ['#fb923c', '#fbbf24'] : ['#f59e0b', '#f97316'];
  const overlay = encodeURIComponent(
    `<svg width="400" height="260" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${palette[0]}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${palette[1]}" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gradient)" rx="32" />
      <path d="M0 220 C 60 180 120 180 180 220 C 240 260 300 260 360 220 L 400 260 L 0 260 Z" fill="rgba(255, 237, 213, 0.65)" />
      <path d="M-40 200 C 40 140 120 140 200 200 C 280 260 360 260 440 200 L 440 260 L -40 260 Z" fill="rgba(254, 215, 170, 0.45)" />
      <circle cx="320" cy="70" r="36" fill="rgba(253, 224, 71, 0.85)" />
      <circle cx="90" cy="80" r="18" fill="rgba(255, 255, 255, 0.4)" />
      <circle cx="60" cy="120" r="14" fill="rgba(255, 255, 255, 0.3)" />
    </svg>`
  );
  return `url("data:image/svg+xml,${overlay}")`;
};

export default ScheduleCard;
