import {
  Badge,
  Box,
  Image,
  Stack,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
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
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box
      bg={cardBg}
      borderRadius="28px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 6 }}
      boxShadow="xl"
      h="100%"
    >
      <Stack spacing={4} h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            Upcoming Schedule
          </Text>
          <Text fontSize="sm" color="gray.500">
            Stay ready for the adventures ahead.
          </Text>
        </Stack>

        <VStack spacing={4} align="stretch">
          {schedule.map((event) => (
            <EventCard key={event.id} event={event} layout={layout} />
          ))}
        </VStack>
      </Stack>
    </Box>
  );
};

interface EventCardProps {
  event: ScheduleEvent;
  layout: 'row' | 'column';
}

const EventCard = ({ event, layout }: EventCardProps) => {
  const accent = useColorModeValue('gray.50', 'whiteAlpha.200');
  const border = useColorModeValue('gray.100', 'whiteAlpha.300');
  const date = dayjs(event.start_time).format('ddd, MMM D • h:mm A');

  return (
    <Box
      bg={accent}
      borderRadius="24px"
      overflow="hidden"
      borderWidth="1px"
      borderColor={border}
    >
      <Stack direction={layout} spacing={0} align="stretch">
        {event.cover_image && (
          <Image
            src={event.cover_image}
            alt={event.title}
            objectFit="cover"
            w={layout === 'row' ? '40%' : '100%'}
            maxH={layout === 'row' ? 'auto' : '160px'}
          />
        )}
        <Stack spacing={3} p={5} justify="space-between">
          <Stack spacing={1}>
            <Badge
              alignSelf="flex-start"
              colorScheme={event.color_scheme === 'orange' ? 'orange' : 'purple'}
              borderRadius="full"
            >
              {event.location}
            </Badge>
            <Text fontWeight="semibold" fontSize="lg">
              {event.title}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {date}
            </Text>
          </Stack>
          <Text fontSize="xs" textTransform="uppercase" color="gray.400" letterSpacing="0.2em">
            {dayjs(event.end_time).diff(dayjs(event.start_time), 'hour')}h journey
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ScheduleCard;
