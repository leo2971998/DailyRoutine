import { Avatar, AvatarGroup, Badge, Box, Stack, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { ScheduleEvent } from '../api/types';

dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);

interface ScheduleCardProps {
  schedule: ScheduleEvent[];
  layout: 'row' | 'column';
}

const ScheduleCard = ({ schedule, layout }: ScheduleCardProps) => {
  const cardBg = useColorModeValue('linear-gradient(150deg, #ffedd5, #fde68a)', 'gray.800');
  const border = useColorModeValue('rgba(251, 191, 36, 0.3)', 'gray.700');

  return (
    <Box
      bg={cardBg}
      borderRadius="22px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 6 }}
      boxShadow="0 12px 40px rgba(217, 119, 6, 0.18)"
      h="100%"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.35}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'480\' height=\'320\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg stroke=\'rgba(255,255,255,0.4)\' stroke-width=\'1\' fill=\'none\'%3E%3Cpath d=\'M20 100c24-36 48-36 72 0s48 36 72 0 48-36 72 0 48 36 72 0\'/%3E%3C/g%3E%3C/svg%3E')"
      />
      <Stack spacing={4} h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            Upcoming Schedule
          </Text>
          <Text fontSize="sm" color="brand.900" opacity={0.7}>
            Stay ready for the adventures ahead.
          </Text>
        </Stack>

        <VStack spacing={4} align="stretch">
          {schedule.map((event, index) => (
            <EventCard key={event.id} event={event} layout={layout} index={index} />
          ))}
        </VStack>
      </Stack>
    </Box>
  );
};

interface EventCardProps {
  event: ScheduleEvent;
  layout: 'row' | 'column';
  index: number;
}

const EventCard = ({ event, layout, index }: EventCardProps) => {
  const accent = useColorModeValue('rgba(255, 247, 237, 0.75)', 'whiteAlpha.200');
  const border = useColorModeValue('rgba(251, 191, 36, 0.35)', 'whiteAlpha.300');
  const date = dayjs(event.start_time).format('ddd, MMM D • h:mm A');
  const scenicBackground = getScenicBackground(event);
  const duration = dayjs(event.end_time).diff(dayjs(event.start_time), 'hour');
  const rotation = index % 2 === 0 ? '-1.2deg' : '1deg';
  const badgeColor = event.color_scheme === 'orange' ? 'brand.500' : 'brand.400';

  return (
    <Box
      bg={accent}
      borderRadius="22px"
      overflow="hidden"
      borderWidth="1px"
      borderColor={border}
      boxShadow="0 10px 34px rgba(217, 119, 6, 0.18)"
      transform={`rotate(${rotation})`}
    >
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
            color="brand.700"
            fontWeight="semibold"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.2em"
          >
            {date}
          </Box>
          <AvatarGroup
            max={3}
            size="sm"
            position="absolute"
            bottom={4}
            left={4}
            spacing="-0.5rem"
          >
            {generateCompanions(event.id).map((companion) => (
              <Avatar
                key={companion.name}
                name={companion.name}
                bg={companion.color}
                color="white"
                borderRadius="14px"
              />
            ))}
          </AvatarGroup>
        </Box>
        <Stack spacing={3} p={5} justify="space-between" bg="rgba(255, 255, 255, 0.85)">
          <Stack spacing={2}>
            <Badge
              alignSelf="flex-start"
              borderRadius="full"
              px={3}
              py={1}
              bg={`${badgeColor}33`}
              color={badgeColor}
            >
              {event.location}
            </Badge>
            <Text fontWeight="semibold" fontSize="lg" color="brand.800">
              {event.title}
            </Text>
            <Text fontSize="sm" color="brand.900" opacity={0.65}>
              Adventure mood: {event.color_scheme === 'orange' ? 'sunny escape' : 'creative retreat'}
            </Text>
          </Stack>
          <Text fontSize="xs" textTransform="uppercase" color="brand.600" letterSpacing="0.3em">
            {duration}h journey
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
    color: palette[index % palette.length]
  }));
};

const getScenicBackground = (event: ScheduleEvent) => {
  const palette = event.color_scheme === 'orange'
    ? ['#fb923c', '#fbbf24']
    : ['#f59e0b', '#f97316'];
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
