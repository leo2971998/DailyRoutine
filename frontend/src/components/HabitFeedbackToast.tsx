import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  HStack,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { applyHabitCoach } from '@/api/clients';
import { api } from '@/lib/api-client';

interface HabitFeedbackToastProps {
  habitId: string;
  habitName: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const HabitFeedbackToast = ({ habitId, habitName, userId, isOpen, onClose }: HabitFeedbackToastProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSignal = async (signal: 'too_easy' | 'just_right' | 'too_hard') => {
    setIsSubmitting(true);
    try {
      await api.post('/ai/feedback', {
        user_id: userId,
        entity_type: 'habit',
        entity_id: habitId,
        signal,
      });
      if (signal !== 'just_right') {
        await applyHabitCoach(habitId, { signal });
      }
      toast({ title: 'Thanks for the feedback', status: 'success' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Could not send feedback', status: 'error' });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Alert
      status="info"
      variant="solid"
      colorScheme="orange"
      borderRadius="16px"
      boxShadow="xl"
      position="fixed"
      bottom={{ base: 4, md: 8 }}
      right={{ base: 4, md: 8 }}
      zIndex={1500}
      maxW="sm"
    >
      <AlertIcon />
      <Stack spacing={2} flex="1">
        <AlertTitle>How did {habitName} feel?</AlertTitle>
        <AlertDescription>
          <Text fontSize="sm">Tune the habit coach so your routine stays sustainable.</Text>
        </AlertDescription>
        <HStack spacing={2}>
          <Button size="sm" variant="outline" onClick={() => handleSignal('too_easy')} isLoading={isSubmitting}>
            Too easy
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleSignal('just_right')} isLoading={isSubmitting}>
            Just right
          </Button>
          <Button size="sm" colorScheme="orange" onClick={() => handleSignal('too_hard')} isLoading={isSubmitting}>
            Too hard
          </Button>
        </HStack>
      </Stack>
    </Alert>
  );
};

export default HabitFeedbackToast;
