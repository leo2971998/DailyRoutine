import {
  Box,
  Button,
  Flex,
  Icon,
  List,
  ListItem,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react';
import { FiRefreshCw, FiStar, FiTrendingUp } from 'react-icons/fi';
import CardContainer from './ui/CardContainer';
import type { DailyInsight, MonthlyInsight } from '@/types';

interface InsightsCardProps {
  title: string;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  children: React.ReactNode;
}

const InsightsCard = ({ title, isLoading, error, onRefresh, children }: InsightsCardProps) => {
  const cardBg = useColorModeValue('surface.translucent', 'whiteAlpha.100');
  const titleColor = useColorModeValue('text.primary', 'text.inverse');
  const subtitleColor = useColorModeValue('text.secondary', 'text.muted');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const refreshButtonBg = useColorModeValue('brand.50', 'brand.900');
  const refreshButtonColor = useColorModeValue('brand.600', 'brand.300');

  return (
    <CardContainer surface="translucent" position="relative">
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
            {title}
          </Text>
          <Text fontSize="sm" color={subtitleColor}>
            AI-powered insights from your data
          </Text>
        </VStack>
        {onRefresh && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Icon as={FiRefreshCw} />}
            onClick={onRefresh}
            bg={refreshButtonBg}
            color={refreshButtonColor}
            _hover={{ bg: useColorModeValue('brand.100', 'brand.800') }}
            isLoading={isLoading}
            loadingText=""
          >
            Refresh
          </Button>
        )}
      </Flex>

      {isLoading && (
        <Flex justify="center" align="center" py={8}>
          <VStack spacing={3}>
            <Spinner size="lg" color="brand.500" thickness="3px" />
            <Text fontSize="sm" color={subtitleColor}>
              Generating insights...
            </Text>
          </VStack>
        </Flex>
      )}

      {error && (
        <Flex justify="center" align="center" py={8}>
          <VStack spacing={3}>
            <Icon as={FiStar} boxSize={8} color={errorColor} />
            <Text fontSize="sm" color={errorColor} textAlign="center">
              {error.message || 'Failed to generate insights'}
            </Text>
            {onRefresh && (
              <Button size="sm" colorScheme="red" variant="outline" onClick={onRefresh}>
                Try Again
              </Button>
            )}
          </VStack>
        </Flex>
      )}

      {!isLoading && !error && children}
    </CardContainer>
  );
};

interface DailyInsightContentProps {
  insight: DailyInsight;
}

export const DailyInsightContent = ({ insight }: DailyInsightContentProps) => {
  const speechColor = useColorModeValue('text.primary', 'text.inverse');
  const bulletColor = useColorModeValue('text.secondary', 'text.muted');
  const bulletIconColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <Stack spacing={6}>
      {insight.speech && (
        <Box>
          <Text fontSize="md" color={speechColor} lineHeight="1.6">
            {insight.speech}
          </Text>
        </Box>
      )}
      
      {insight.bullets && insight.bullets.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={bulletColor} mb={3}>
            Key Points:
          </Text>
          <List spacing={2}>
            {insight.bullets.map((bullet, index) => (
              <ListItem key={index} display="flex" alignItems="flex-start" gap={3}>
                <Icon as={FiTrendingUp} boxSize={4} color={bulletIconColor} mt={0.5} flexShrink={0} />
                <Text fontSize="sm" color={bulletColor} lineHeight="1.5">
                  {bullet}
                </Text>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Stack>
  );
};

interface MonthlyInsightContentProps {
  insight: MonthlyInsight;
}

export const MonthlyInsightContent = ({ insight }: MonthlyInsightContentProps) => {
  const summaryColor = useColorModeValue('text.primary', 'text.inverse');
  const bulletColor = useColorModeValue('text.secondary', 'text.muted');
  const bulletIconColor = useColorModeValue('brand.500', 'brand.300');
  const recommendationColor = useColorModeValue('green.600', 'green.300');

  return (
    <Stack spacing={6}>
      {insight.summary && (
        <Box>
          <Text fontSize="md" color={summaryColor} lineHeight="1.6">
            {insight.summary}
          </Text>
        </Box>
      )}
      
      {insight.bullets && insight.bullets.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={bulletColor} mb={3}>
            Trends & Patterns:
          </Text>
          <List spacing={2}>
            {insight.bullets.map((bullet, index) => (
              <ListItem key={index} display="flex" alignItems="flex-start" gap={3}>
                <Icon as={FiTrendingUp} boxSize={4} color={bulletIconColor} mt={0.5} flexShrink={0} />
                <Text fontSize="sm" color={bulletColor} lineHeight="1.5">
                  {bullet}
                </Text>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {insight.recommendations && insight.recommendations.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={recommendationColor} mb={3}>
            Recommendations:
          </Text>
          <List spacing={2}>
            {insight.recommendations.map((recommendation, index) => (
              <ListItem key={index} display="flex" alignItems="flex-start" gap={3}>
                <Icon as={FiStar} boxSize={4} color={recommendationColor} mt={0.5} flexShrink={0} />
                <Text fontSize="sm" color={bulletColor} lineHeight="1.5">
                  {recommendation}
                </Text>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Stack>
  );
};

export default InsightsCard;
