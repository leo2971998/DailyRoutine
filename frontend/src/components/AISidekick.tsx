import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  VStack,
  Text,
  HStack,
  Code,
  Divider,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { aiSuggest, AIIntent, AISuggestion, AIPatchRef } from '@/lib/aiClient';

export interface AISidekickProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  userId: string;
  entityType: 'task' | 'habit' | 'schedule';
  entityData: Record<string, unknown>;
  intent: AIIntent;
  onApply: (patch: Required<AIPatchRef>) => Promise<void>;
}

const DEFAULT_TAB = 0;

export default function AISidekick({
  isOpen,
  onClose,
  apiBase,
  userId,
  entityType,
  entityData,
  intent,
  onApply,
}: AISidekickProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [tabIndex, setTabIndex] = useState(DEFAULT_TAB);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setSuggestions([]);
      const payload = {
        user_id: userId,
        entity: { type: entityType, data: entityData },
        intent,
        preferences: {
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
      const data = await aiSuggest(apiBase, payload);
      setSuggestions(data.suggestions ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'AI error', description: message, status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [apiBase, entityData, entityType, intent, toast, userId]);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      setApplyingIndex(null);
      setTabIndex(DEFAULT_TAB);
      return;
    }
    fetchSuggestions();
  }, [fetchSuggestions, isOpen]);

  const handleClose = () => {
    setTabIndex(DEFAULT_TAB);
    setSuggestions([]);
    setApplyingIndex(null);
    onClose();
  };

  const handleApply = async (patch: Required<AIPatchRef>, index: number) => {
    try {
      setApplyingIndex(index);
      await onApply(patch);
      toast({ title: 'Suggestion applied', status: 'success' });
      await fetchSuggestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Could not apply suggestion', description: message, status: 'error' });
    } finally {
      setApplyingIndex(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>AI Sidekick</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs index={tabIndex} onChange={setTabIndex} isFitted variant="enclosed">
            <TabList>
              <Tab>Quick Fixes</Tab>
              <Tab>Deeper Edit</Tab>
              <Tab>Automations</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  {loading ? (
                    <HStack justify="center" py={6}>
                      <Spinner />
                      <Text>Thinking…</Text>
                    </HStack>
                  ) : suggestions.length === 0 ? (
                    <Text color="gray.500">No suggestions yet. Try again in a moment.</Text>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <VStack key={index} align="stretch" p={3} borderWidth="1px" borderRadius="xl" spacing={3}>
                        <HStack justify="space-between" align="start">
                          <Text fontWeight="semibold">{suggestion.title}</Text>
                          <Button
                            size="sm"
                            variant="solid"
                            colorScheme="orange"
                            onClick={() => handleApply(sanitizePatch(suggestion.apply_patch), index)}
                            isLoading={applyingIndex === index}
                          >
                            Apply
                          </Button>
                        </HStack>
                        {suggestion.explanation && (
                          <Text fontSize="sm" color="gray.500">
                            {suggestion.explanation}
                          </Text>
                        )}
                        {suggestion.diff && Object.keys(suggestion.diff).length > 0 && (
                          <>
                            <Divider />
                            <Code p={2} borderRadius="md" overflowX="auto" fontSize="xs">
                              {JSON.stringify(suggestion.diff, null, 2)}
                            </Code>
                          </>
                        )}
                      </VStack>
                    ))
                  )}
                </VStack>
              </TabPanel>
              <TabPanel>
                <Text color="gray.600">
                  Ask for a rewrite, split into steps, or propose timing. (Future: free-form prompt box)
                </Text>
              </TabPanel>
              <TabPanel>
                <Text color="gray.600">
                  Turn this into reminders, recurring schedule blocks, or notifications. (Future: one-click flows)
                </Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function sanitizePatch(patch: AIPatchRef): Required<AIPatchRef> {
  return {
    endpoint: patch.endpoint,
    method: (patch.method ?? 'PATCH').toUpperCase() as Required<AIPatchRef>['method'],
    body: patch.body ?? {},
  };
}
