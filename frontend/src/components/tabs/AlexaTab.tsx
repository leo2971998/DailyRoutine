import {
  Box,
  Grid,
  GridItem,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiMic, FiSettings, FiZap } from 'react-icons/fi';
import AlexaTestCard from '../AlexaTestCard';
import CardContainer from '../ui/CardContainer';
import { useAlexaTest, useAlexaHistory } from '@/hooks/useAlexa';
import { useDemoUser } from '@/hooks/useDemoUser';
import type { AlexaTestResult } from '@/types';

const AlexaTab = () => {
  const { data: user } = useDemoUser();
  const [lastResult, setLastResult] = useState<AlexaTestResult | null>(null);
  
  const alexaTest = useAlexaTest();
  const { data: history = [] } = useAlexaHistory(user?._id || '');

  const titleColor = useColorModeValue('text.primary', 'text.inverse');
  const subtitleColor = useColorModeValue('text.secondary', 'text.muted');
  const featureBg = useColorModeValue('brand.50', 'brand.900');
  const featureText = useColorModeValue('brand.800', 'brand.200');

  const handleTestCommand = async (command: string) => {
    if (!user?._id) return;

    try {
      const response = await alexaTest.mutateAsync({
        command,
        userId: user._id
      });

      const result: AlexaTestResult = {
        command,
        response,
        success: true
      };

      setLastResult(result);
    } catch (error) {
      const result: AlexaTestResult = {
        command,
        response: {
          speech: 'Error processing command',
          intent: 'Error',
          slots: {},
          timestamp: new Date().toISOString()
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setLastResult(result);
    }
  };

  if (!user) {
    return (
      <Box textAlign="center" py={20}>
        <Text color="text.muted">Please log in to test Alexa commands</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="text.primary" textAlign="center">
          Alexa Integration
        </Text>
        <Text fontSize="md" color="text.secondary" textAlign="center" maxW="2xl" mx="auto">
          Test voice commands and see how Alexa would respond to your daily routine requests
        </Text>
      </VStack>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <AlexaTestCard
            onTestCommand={handleTestCommand}
            isLoading={alexaTest.isPending}
            lastResult={lastResult}
            history={history}
          />
        </GridItem>

        <GridItem colSpan={{ base: 1, lg: 1 }}>
          <VStack spacing={6} align="stretch">
            <CardContainer surface="translucent">
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Icon as={FiMic} boxSize={6} color="brand.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
                      Voice Commands
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Supported intents
                    </Text>
                  </VStack>
                </HStack>
                
                <VStack align="stretch" spacing={2}>
                  <Box bg={featureBg} borderRadius="8px" p={3}>
                    <Text fontSize="sm" fontWeight="medium" color={featureText}>
                      Tasks
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      "add task [description]", "complete task [name]", "list my tasks"
                    </Text>
                  </Box>
                  
                  <Box bg={featureBg} borderRadius="8px" p={3}>
                    <Text fontSize="sm" fontWeight="medium" color={featureText}>
                      Habits
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      "log habit [name]", "check habit streak"
                    </Text>
                  </Box>
                  
                  <Box bg={featureBg} borderRadius="8px" p={3}>
                    <Text fontSize="sm" fontWeight="medium" color={featureText}>
                      Schedule
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      "add event [description]", "what's my schedule"
                    </Text>
                  </Box>
                  
                  <Box bg={featureBg} borderRadius="8px" p={3}>
                    <Text fontSize="sm" fontWeight="medium" color={featureText}>
                      Summary
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      "daily briefing", "how am I doing"
                    </Text>
                  </Box>
                </VStack>
              </VStack>
            </CardContainer>

            <CardContainer surface="translucent">
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Icon as={FiSettings} boxSize={6} color="brand.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
                      Setup Status
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Configuration required
                    </Text>
                  </VStack>
                </HStack>
                
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={titleColor}>
                      Environment Variables:
                    </Text>
                    <Text fontSize="xs" color={subtitleColor} fontFamily="mono">
                      API_BASE=http://localhost:8000<br/>
                      FIXED_USER_ID=68dcaa1e450fee4dd3d6b17b
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={titleColor}>
                      Lambda Function:
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      Deploy to AWS Lambda with the handler code
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={titleColor}>
                      Alexa Skill:
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      Configure in Amazon Developer Console
                    </Text>
                  </Box>
                </VStack>
              </VStack>
            </CardContainer>

            <CardContainer surface="translucent">
              <VStack spacing={4} align="stretch">
                <HStack spacing={3}>
                  <Icon as={FiZap} boxSize={6} color="brand.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
                      Testing Mode
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Mock responses
                    </Text>
                  </VStack>
                </HStack>
                
                <Text fontSize="sm" color={subtitleColor}>
                  This interface simulates Alexa responses for testing purposes. 
                  In production, commands would be processed by the actual Alexa skill.
                </Text>
              </VStack>
            </CardContainer>
          </VStack>
        </GridItem>
      </Grid>
    </Stack>
  );
};

export default AlexaTab;
