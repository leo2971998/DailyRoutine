import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  Text,
  Textarea,
  useBreakpointValue,
  useColorModeValue
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
  const inputBg = useColorModeValue('bg.primary', 'whiteAlpha.100');
  const inputBorder = useColorModeValue('border.subtle', 'whiteAlpha.200');
  const labelColor = useColorModeValue('text.secondary', 'text.muted');

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onEntryChange(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLDivElement>) => {
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
        bg={inputBg}
        borderColor={inputBorder}
        _focus={{
          borderColor: 'brand.400',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
        }}
        minH={{ base: '120px', md: '100px' }}
      />
      <Stack spacing={3} w={{ base: '100%', md: '40%' }}>
        <Box>
          <Text fontSize="sm" color={labelColor} mb={2} fontWeight="medium">
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
