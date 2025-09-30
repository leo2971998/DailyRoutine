import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Collapse,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
  Textarea,
  VStack,
  useBreakpointValue,
  useColorModeValue
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiFeather, FiPlus } from 'react-icons/fi';
import { DailyLogDay, DailyLogEntry, RoutineTask } from '../api/types';

const moodPalette = [
  { id: 'radiant', label: 'Radiant', emoji: '🌞' },
  { id: 'steady', label: 'Steady', emoji: '🌤️' },
  { id: 'reflective', label: 'Reflective', emoji: '🌙' }
];

interface DailyLogCardProps {
  log: DailyLogDay;
  checklist: RoutineTask[];
}

const DailyLogCard = ({ log, checklist }: DailyLogCardProps) => {
  const [entryText, setEntryText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>('radiant');
  const [entries, setEntries] = useState<DailyLogEntry[]>(log.entries);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(log.entries[0]?.id ?? null);
  const orientation = useBreakpointValue<'column' | 'row'>({ base: 'column', md: 'row' });
  const cardBg = useColorModeValue(
    'linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(255, 247, 237, 0.95))',
    'gray.800'
  );
  const borderColor = useColorModeValue('rgba(251, 191, 36, 0.45)', 'gray.700');

  const moodMeta = useMemo(
    () => moodPalette.find((mood) => mood.id === selectedMood) ?? null,
    [selectedMood]
  );

  const taskLookup = useMemo(() => {
    const pairs = checklist.map((task) => [task.id, task.title] as const);
    return Object.fromEntries(pairs) as Record<string, string>;
  }, [checklist]);

  useEffect(() => {
    setEntries(log.entries);
    setExpandedEntry(log.entries[0]?.id ?? null);
  }, [log.entries]);

  const handleAddEntry = () => {
    const trimmed = entryText.trim();
    if (!trimmed) {
      return;
    }

    const newEntry: DailyLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      content: trimmed,
      source: 'manual',
      mood: moodMeta ? { ...moodMeta } : undefined,
      details: null
    };

    setEntries((prev) => [newEntry, ...prev]);
    setEntryText('');
    setExpandedEntry(newEntry.id);
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="24px"
      borderWidth="1px"
      borderColor={borderColor}
      px={{ base: 5, md: 8 }}
      py={{ base: 6, md: 8 }}
      boxShadow="0 20px 50px rgba(217, 119, 6, 0.18)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.35}
        backgroundImage="radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(253, 186, 116, 0.25), transparent 50%), radial-gradient(circle at 20% 85%, rgba(234, 88, 12, 0.18), transparent 60%)"
      />
      <Stack spacing={{ base: 6, md: 7 }} position="relative" zIndex={1}>
        <Stack spacing={2}>
          <HStack spacing={3} align={{ base: 'flex-start', md: 'center' }} flexWrap="wrap">
            <Box
              borderRadius="18px"
              bg="rgba(249, 115, 22, 0.15)"
              color="brand.700"
              px={3}
              py={1.5}
              fontWeight="semibold"
            >
              Daily Log
            </Box>
            <Text color="brand.800" fontWeight="semibold" fontSize="lg">
              {dayjs(log.date).format('dddd, MMM D')}
            </Text>
            <Badge colorScheme="orange" borderRadius="full" px={3} py={1} fontSize="0.7rem">
              {log.entries.length} moments today
            </Badge>
          </HStack>
          <Text color="brand.900" opacity={0.75} maxW="3xl">
            {log.focus}
          </Text>
        </Stack>

        <Stack
          direction={orientation}
          spacing={{ base: 4, md: 6 }}
          align={{ base: 'stretch', md: 'flex-end' }}
        >
          <Textarea
            value={entryText}
            onChange={(event) => setEntryText(event.target.value)}
            placeholder="Capture a warm moment or feeling..."
            borderRadius="18px"
            bg="rgba(255, 255, 255, 0.9)"
            borderColor="rgba(251, 191, 36, 0.35)"
            _focus={{
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
            }}
            minH={{ base: '120px', md: '100px' }}
          />
          <Stack spacing={3} w={{ base: '100%', md: '40%' }}>
            <Box>
              <Text fontSize="sm" color="brand.700" mb={2} fontWeight="medium">
                Mood for this moment
              </Text>
              <ButtonGroup size="sm" isAttached colorScheme="orange">
                {moodPalette.map((mood) => {
                  const isActive = selectedMood === mood.id;
                  return (
                    <Button
                      key={mood.id}
                      onClick={() => setSelectedMood(isActive ? null : mood.id)}
                      variant={isActive ? 'solid' : 'outline'}
                      leftIcon={
                        <Box as="span" fontSize="lg">
                          {mood.emoji}
                        </Box>
                      }
                    >
                      {mood.label}
                    </Button>
                  );
                })}
              </ButtonGroup>
            </Box>
            <Button
              leftIcon={<Icon as={FiPlus} />} 
              onClick={handleAddEntry}
              colorScheme="orange"
              borderRadius="16px"
              size="lg"
            >
              Add entry
            </Button>
          </Stack>
        </Stack>

        <VStack align="stretch" spacing={5} divider={<Box borderTopWidth="1px" borderColor="rgba(251, 191, 36, 0.25)" />}>
          {entries.map((entry) => {
            const isExpanded = expandedEntry === entry.id;
            const relatedTask = entry.related_task_id
              ? taskLookup[entry.related_task_id]
              : undefined;

            return (
              <Stack key={entry.id} spacing={3}>
                <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
                  <HStack align="flex-start" spacing={3}>
                    <Box
                      borderRadius="50%"
                      bg="rgba(249, 115, 22, 0.16)"
                      color="brand.700"
                      w="42px"
                      h="42px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xl"
                      boxShadow="inset 0 0 0 1px rgba(249, 115, 22, 0.25)"
                    >
                      {entry.mood?.emoji ?? '📝'}
                    </Box>
                    <Stack spacing={1}>
                      <HStack spacing={2} flexWrap="wrap">
                        <Text fontWeight="semibold" color="brand.900">
                          {dayjs(entry.timestamp).format('h:mm A')}
                        </Text>
                        {entry.source === 'checklist' && (
                          <Badge colorScheme="orange" borderRadius="full" px={2} py={0.5} fontSize="0.65rem">
                            <HStack spacing={1}>
                              <Icon as={FiCheckCircle} />
                              <Text>{relatedTask ? `Checklist · ${relatedTask}` : 'Checklist log'}</Text>
                            </HStack>
                          </Badge>
                        )}
                        {entry.source === 'manual' && (
                          <Badge colorScheme="orange" variant="subtle" borderRadius="full" px={2} py={0.5} fontSize="0.65rem">
                            <HStack spacing={1}>
                              <Icon as={FiFeather} />
                              <Text>Personal note</Text>
                            </HStack>
                          </Badge>
                        )}
                      </HStack>
                      <Text color="brand.900">{entry.content}</Text>
                    </Stack>
                  </HStack>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="orange"
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  >
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </Button>
                </Flex>
                <Collapse in={isExpanded} animateOpacity>
                  <Box pl={{ base: 0, md: 14 }} color="brand.900" opacity={0.8} fontSize="sm">
                    {entry.details ? entry.details : 'Capture a reflection or add a highlight when you are ready.'}
                  </Box>
                </Collapse>
              </Stack>
            );
          })}
        </VStack>
      </Stack>
    </Box>
  );
};

export default DailyLogCard;

