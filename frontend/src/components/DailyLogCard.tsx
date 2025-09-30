import { Badge, Box, HStack, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { DailyLogDay, DailyLogEntry, RoutineTask } from '../api/types';
import CardContainer from './ui/CardContainer';
import DailyLogEntries from './daily-log/DailyLogEntries';
import LogEntryForm, { MoodOption } from './daily-log/LogEntryForm';

const moodPalette: MoodOption[] = [
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
  const accentText = useColorModeValue('brand.600', 'brand.200');
  const badgeBackground = useColorModeValue('bg.accent', 'whiteAlpha.100');
  const badgeBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');

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

  const handleToggleEntry = (entryId: string) => {
    setExpandedEntry((current) => (current === entryId ? null : entryId));
  };

  return (
    <CardContainer surface="muted">
      <Stack spacing={{ base: 6, md: 7 }} position="relative" zIndex={1}>
        <Stack spacing={2}>
          <HStack spacing={3} align={{ base: 'flex-start', md: 'center' }} flexWrap="wrap">
            <Badge
              borderRadius="full"
              px={4}
              py={1.5}
              bg={badgeBackground}
              borderWidth="1px"
              borderColor={badgeBorder}
              color={accentText}
              fontWeight="semibold"
            >
              Daily Log
            </Badge>
            <Text color={accentText} fontWeight="semibold" fontSize="lg">
              {dayjs(log.date).format('dddd, MMM D')}
            </Text>
            <Badge colorScheme="orange" borderRadius="full" px={3} py={1} fontSize="0.7rem">
              {entries.length} moments today
            </Badge>
          </HStack>
          <Text color="text.secondary" maxW="3xl">
            {log.focus}
          </Text>
        </Stack>

        <LogEntryForm
          entryText={entryText}
          onEntryChange={setEntryText}
          onSubmit={handleAddEntry}
          moodOptions={moodPalette}
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
        />

        <DailyLogEntries
          entries={entries}
          expandedEntry={expandedEntry}
          onToggle={handleToggleEntry}
          taskLookup={taskLookup}
        />
      </Stack>
      <Box
        position="absolute"
        inset={0}
        opacity={0.28}
        backgroundImage="radial-gradient(circle at 12% 18%, rgba(249, 115, 22, 0.22), transparent 55%), radial-gradient(circle at 82% 12%, rgba(253, 186, 116, 0.22), transparent 55%)"
        pointerEvents="none"
      />
    </CardContainer>
  );
};

export default DailyLogCard;
