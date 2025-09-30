import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  Text,
  Textarea,
  useBreakpointValue
} from '@chakra-ui/react';
import { ChangeEvent, FormEvent } from 'react';
import { FiPlus } from 'react-icons/fi';

export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
}

interface LogEntryFormProps {
  entryText: string;
  onEntryChange: (value: string) => void;
  onSubmit: () => void;
  moodOptions: MoodOption[];
  selectedMood: string | null;
  onSelectMood: (moodId: string | null) => void;
}

const LogEntryForm = ({
  entryText,
  onEntryChange,
  onSubmit,
  moodOptions,
  selectedMood,
  onSelectMood
}: LogEntryFormProps) => {
  const orientation = useBreakpointValue<'column' | 'row'>({ base: 'column', md: 'row' });

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onEntryChange(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Stack
      as="form"
      onSubmit={handleSubmit}
      direction={orientation}
      spacing={{ base: 4, md: 6 }}
      align={{ base: 'stretch', md: 'flex-end' }}
    >
      <Textarea
        value={entryText}
        onChange={handleChange}
        placeholder="Capture a warm moment or feeling..."
        borderRadius="18px"
        bg="rgba(255, 255, 255, 0.9)"
        borderColor="rgba(251, 191, 36, 0.28)"
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
            {moodOptions.map((mood) => {
              const isActive = selectedMood === mood.id;
              return (
                <Button
                  key={mood.id}
                  onClick={() => onSelectMood(isActive ? null : mood.id)}
                  variant={isActive ? 'solid' : 'outline'}
                  leftIcon={<Box as="span" fontSize="lg">{mood.emoji}</Box>}
                  type="button"
                >
                  {mood.label}
                </Button>
              );
            })}
          </ButtonGroup>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="orange"
          borderRadius="16px"
          size="lg"
          type="submit"
        >
          Add entry
        </Button>
      </Stack>
    </Stack>
  );
};

export default LogEntryForm;
