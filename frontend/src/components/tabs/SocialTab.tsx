import { Box, Stack, Text } from '@chakra-ui/react';
import CardContainer from '../ui/CardContainer';

const SocialTab = () => (
  <Box maxW="5xl" mx="auto">
    <CardContainer surface="muted">
      <Stack spacing={4} align="center" textAlign="center" py={16}>
        <Text fontSize="lg" fontWeight="semibold" color="text.primary">
          Team adventures coming soon
        </Text>
        <Text fontSize="sm" color="text.secondary" maxW="lg">
          Collaborative progress tracking will return once the realtime features are ready. Stay tuned for shared challenges
          and celebrations!
        </Text>
      </Stack>
    </CardContainer>
  </Box>
);

export default SocialTab;
