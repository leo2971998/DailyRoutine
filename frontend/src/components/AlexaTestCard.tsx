import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiMic, FiMicOff, FiPlay, FiSend } from 'react-icons/fi';
import CardContainer from './ui/CardContainer';
import type { AlexaCommand, AlexaTestResult } from '@/types';

interface AlexaTestCardProps {
  onTestCommand: (command: string) => void;
  isLoading?: boolean;
  lastResult?: AlexaTestResult | null;
  history?: AlexaTestResult[];
}

const AlexaTestCard = ({ onTestCommand, isLoading, lastResult, history = [] }: AlexaTestCardProps) => {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);

  const cardBg = useColorModeValue('surface.translucent', 'whiteAlpha.100');
  const titleColor = useColorModeValue('text.primary', 'text.inverse');
  const subtitleColor = useColorModeValue('text.secondary', 'text.muted');
  const inputBg = useColorModeValue('white', 'whiteAlpha.200');
  const inputBorder = useColorModeValue('rgba(15, 23, 42, 0.06)', 'rgba(255, 255, 255, 0.12)');
  const responseBg = useColorModeValue('brand.50', 'brand.900');
  const responseText = useColorModeValue('brand.800', 'brand.200');
  const historyBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onTestCommand(command.trim());
      setCommand('');
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // In a real implementation, this would start/stop voice recognition
    if (!isListening) {
      // Simulate voice input
      setTimeout(() => {
        setCommand('add task test voice input');
        setIsListening(false);
      }, 2000);
    }
  };

  const quickCommands = [
    'add task review project proposal',
    'complete task review project proposal',
    'list my tasks',
    'log habit morning exercise',
    'check habit streak',
    'add event team meeting at 2pm',
    'what\'s my schedule',
    'daily briefing',
    'how am I doing'
  ];

  return (
    <CardContainer surface="translucent">
      <VStack spacing={6} align="stretch">
        <VStack align="start" spacing={2}>
          <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
            Alexa Voice Commands
          </Text>
          <Text fontSize="sm" color={subtitleColor}>
            Test voice commands and see how Alexa would respond
          </Text>
        </VStack>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiMic} color="brand.500" />
              </InputLeftElement>
              <Input
                placeholder="Try: 'add task review project proposal'"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)' }}
              />
            </InputGroup>
            
            <Flex gap={2}>
              <Button
                type="submit"
                colorScheme="brand"
                leftIcon={<Icon as={FiSend} />}
                isLoading={isLoading}
                loadingText="Testing..."
                flex={1}
              >
                Test Command
              </Button>
              <Button
                variant="outline"
                leftIcon={<Icon as={isListening ? FiMicOff : FiMic} />}
                onClick={handleVoiceInput}
                colorScheme={isListening ? 'red' : 'brand'}
              >
                {isListening ? 'Stop' : 'Voice'}
              </Button>
            </Flex>
          </VStack>
        </form>

        {lastResult && (
          <Box bg={responseBg} borderRadius="12px" p={4}>
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="medium" color={responseText}>
                Alexa Response:
              </Text>
              <Text fontSize="md" color={responseText} fontStyle="italic">
                "{lastResult.response.speech}"
              </Text>
              <Flex justify="space-between" fontSize="xs" color={subtitleColor}>
                <Text>Intent: {lastResult.response.intent}</Text>
                <Text>{new Date(lastResult.response.timestamp).toLocaleTimeString()}</Text>
              </Flex>
            </VStack>
          </Box>
        )}

        <Box>
          <Text fontSize="sm" fontWeight="medium" color={titleColor} mb={3}>
            Quick Commands:
          </Text>
          <Flex wrap="wrap" gap={2}>
            {quickCommands.map((cmd, index) => (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                leftIcon={<Icon as={FiPlay} />}
                onClick={() => setCommand(cmd)}
                bg={historyBg}
                _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.100') }}
              >
                {cmd}
              </Button>
            ))}
          </Flex>
        </Box>

        {history.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={titleColor} mb={3}>
              Command History:
            </Text>
            <List spacing={2} maxH="200px" overflowY="auto">
              {history.slice(0, 5).map((result, index) => (
                <ListItem key={index} fontSize="sm" color={subtitleColor}>
                  <Text fontWeight="medium">"{result.command}"</Text>
                  <Text fontSize="xs" color={subtitleColor}>
                    → {result.response.speech}
                  </Text>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </VStack>
    </CardContainer>
  );
};

export default AlexaTestCard;
