import {
  Badge,
  Box,
  Collapse,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { FiCheckCircle, FiFeather } from 'react-icons/fi';
import { DailyLogEntry } from '../../api/types';

interface DailyLogEntriesProps {
  entries: DailyLogEntry[];
  expandedEntry: string | null;
  onToggle: (entryId: string) => void;
  taskLookup: Record<string, string>;
}

const DailyLogEntries = ({ entries, expandedEntry, onToggle, taskLookup }: DailyLogEntriesProps) => (
  <VStack
    align="stretch"
    spacing={5}
    divider={<Box borderTopWidth="1px" borderColor="rgba(251, 191, 36, 0.18)" />}
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
                {entry.mood?.emoji ?? '🧭'}
              </Box>
              <Stack spacing={1}>
                <HStack spacing={2} align="center" flexWrap="wrap">
                  <Text fontWeight="semibold" color="brand.800">
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
                    <Badge borderRadius="full" px={3} py={0.5} bg="rgba(251, 191, 36, 0.2)" color="brand.700">
                      {relatedTask}
                    </Badge>
                  )}
                </HStack>
                <Text color="brand.900" opacity={0.78} noOfLines={isExpanded ? undefined : 2}>
                  {entry.content}
                </Text>
              </Stack>
            </HStack>
            <Icon
              as={FiFeather}
              color={isExpanded ? 'brand.500' : 'brand.300'}
              cursor="pointer"
              onClick={() => onToggle(entry.id)}
              transition="all 0.2s ease"
            />
          </Flex>
          <Collapse in={isExpanded} animateOpacity>
            <Stack
              spacing={2}
              bg="rgba(255, 255, 255, 0.86)"
              borderRadius="16px"
              px={4}
              py={3}
            >
              <HStack spacing={2} color="brand.600" fontSize="sm">
                <Icon as={FiCheckCircle} />
                <Text>Captured {dayjs(entry.timestamp).fromNow()}</Text>
              </HStack>
              {entry.details?.highlight && (
                <Text fontSize="sm" color="brand.700" opacity={0.8}>
                  {entry.details.highlight}
                </Text>
              )}
            </Stack>
          </Collapse>
        </Stack>
      );
    })}
  </VStack>
);

export default DailyLogEntries;
