import {
  Badge,
  Box,
  Collapse,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import dayjs from '../../utils/dayjs';
import { FiCheckCircle, FiFeather } from 'react-icons/fi';
import { DailyLogEntry } from '../../api/types';

interface DailyLogEntriesProps {
  entries: DailyLogEntry[];
  expandedEntry: string | null;
  onToggle: (entryId: string) => void;
  taskLookup: Record<string, string>;
}

const DailyLogEntries = ({ entries, expandedEntry, onToggle, taskLookup }: DailyLogEntriesProps) => {
  const dividerColor = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const moodBackground = useColorModeValue('bg.accent', 'whiteAlpha.100');
  const moodColor = useColorModeValue('brand.600', 'brand.200');
  const moodShadow = useColorModeValue(
    'inset 0 0 0 1px rgba(234, 88, 12, 0.25)',
    'inset 0 0 0 1px rgba(248, 113, 113, 0.35)'
  );
  const relatedTaskBg = useColorModeValue('rgba(253, 224, 71, 0.2)', 'rgba(250, 204, 21, 0.2)');
  const relatedTaskColor = useColorModeValue('brand.600', 'brand.200');
  const featherActive = useColorModeValue('brand.500', 'brand.200');
  const featherInactive = useColorModeValue('brand.300', 'brand.400');
  const detailsBackground = useColorModeValue('bg.secondary', 'whiteAlpha.100');
  const detailsColor = useColorModeValue('text.secondary', 'text.muted');
  const timestampColor = useColorModeValue('text.muted', 'text.muted');

  return (
    <VStack
      align="stretch"
      spacing={5}
      divider={<Box borderTopWidth="1px" borderColor={dividerColor} />}
    >
      {entries.map((entry) => {
        const isExpanded = expandedEntry === entry.id;
        const relatedTask = entry.related_task_id ? taskLookup[entry.related_task_id] : undefined;

        return (
          <Stack key={entry.id} spacing={3} role="listitem">
            <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
              <HStack align="flex-start" spacing={3}>
                <Box
                  borderRadius="full"
                  bg={moodBackground}
                  color={moodColor}
                  w="42px"
                  h="42px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xl"
                  boxShadow={moodShadow}
                >
                  {entry.mood?.emoji ?? '🧭'}
                </Box>
                <Stack spacing={1}>
                  <HStack spacing={2} align="center" flexWrap="wrap">
                    <Text fontWeight="semibold" color="text.primary">
                      {dayjs(entry.timestamp).format('h:mm A')}
                    </Text>
                    {entry.source === 'manual' ? (
                      <Badge colorScheme="orange" borderRadius="full" px={2} py={0.5} fontSize="0.65rem">
                        Personal note
                      </Badge>
                    ) : (
                      <Badge colorScheme="yellow" borderRadius="full" px={2} py={0.5} fontSize="0.65rem">
                        Auto-imported
                      </Badge>
                    )}
                    {relatedTask && (
                      <Badge borderRadius="full" px={3} py={0.5} bg={relatedTaskBg} color={relatedTaskColor}>
                        {relatedTask}
                      </Badge>
                    )}
                  </HStack>
                  <Text color="text.secondary" noOfLines={isExpanded ? undefined : 2}>
                    {entry.content}
                  </Text>
                </Stack>
              </HStack>
              <Icon
                as={FiFeather}
                color={isExpanded ? featherActive : featherInactive}
                cursor="pointer"
                onClick={() => onToggle(entry.id)}
                transition="all 0.2s ease"
              />
            </Flex>
            <Collapse in={isExpanded} animateOpacity>
              <Stack spacing={2} bg={detailsBackground} borderRadius="16px" px={4} py={3}>
                <HStack spacing={2} color={timestampColor} fontSize="sm">
                  <Icon as={FiCheckCircle} />
                  <Text>Captured {dayjs(entry.timestamp).fromNow()}</Text>
                </HStack>
                {entry.details && (
                  <Text fontSize="sm" color={detailsColor}>
                    {entry.details}
                  </Text>
                )}
              </Stack>
            </Collapse>
          </Stack>
        );
      })}
    </VStack>
  );
};

export default DailyLogEntries;
