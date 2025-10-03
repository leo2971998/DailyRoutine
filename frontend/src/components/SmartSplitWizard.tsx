import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { createSubtasks, splitTaskText } from '@/api/clients';
import type { Task } from '@/types';

interface SmartSplitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const SmartSplitWizard = ({ isOpen, onClose, task }: SmartSplitWizardProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setPrompt(task.description ?? '');
      setSteps([]);
    }
  }, [isOpen, task?.description]);

  const canSubmit = useMemo(() => steps.some((step) => step.trim().length > 0), [steps]);

  const handleGenerate = async () => {
    if (!task) return;
    const seed = prompt.trim();
    if (!seed) {
      toast({ title: 'Describe the work first', status: 'warning' });
      return;
    }

    setIsGenerating(true);
    try {
      const { steps: generated } = await splitTaskText({ text: seed, max_steps: 5 });
      setSteps(generated);
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not generate steps', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddStep = () => {
    setSteps((current) => [...current, '']);
  };

  const handleChangeStep = (index: number, value: string) => {
    setSteps((current) => current.map((step, idx) => (idx === index ? value : step)));
  };

  const handleRemoveStep = (index: number) => {
    setSteps((current) => current.filter((_, idx) => idx !== index));
  };

  const handleCreateSubtasks = async () => {
    if (!task) return;

    const payloadSteps = steps
      .map((step) => step.trim())
      .filter((step) => step.length > 0)
      .map((description) => ({ description }));

    if (payloadSteps.length === 0) {
      toast({ title: 'Add at least one step', status: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubtasks(task._id, { items: payloadSteps });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Subtasks created', status: 'success' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not save subtasks', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Smart Split</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={5}>
            <FormControl>
              <FormLabel>What needs to happen?</FormLabel>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Summarize the task to break down"
                minH="120px"
              />
            </FormControl>
            <Button onClick={handleGenerate} isLoading={isGenerating} alignSelf="flex-start" colorScheme="orange">
              Generate steps
            </Button>

            {steps.length > 0 ? (
              <Stack spacing={3}>
                <Text fontWeight="semibold">Review steps</Text>
                {steps.map((step, index) => (
                  <HStack key={index} align="flex-start" spacing={3}>
                    <Input
                      value={step}
                      onChange={(event) => handleChangeStep(index, event.target.value)}
                      placeholder={`Step ${index + 1}`}
                    />
                    <IconButton
                      aria-label="Remove step"
                      icon={<FiTrash2 />}
                      variant="ghost"
                      onClick={() => handleRemoveStep(index)}
                    />
                  </HStack>
                ))}
                <Button leftIcon={<FiPlus />} onClick={handleAddStep} variant="ghost" alignSelf="flex-start">
                  Add another step
                </Button>
              </Stack>
            ) : (
              <Box p={4} borderRadius="md" bg="bg.secondary">
                <Text fontSize="sm" color="text.secondary">
                  Generate steps to preview AI suggestions, then edit them before creating subtasks.
                </Text>
              </Box>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleCreateSubtasks}
              isLoading={isSubmitting}
              isDisabled={!canSubmit}
            >
              Create subtasks
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SmartSplitWizard;
