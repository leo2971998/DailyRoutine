import { Box, HStack, Icon, Stack, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import { FiMessageCircle, FiPaperclip, FiUserPlus } from 'react-icons/fi';

const messages = [
  {
    name: 'Nora the Navigator',
    text: 'Packed the maps for our sunrise trail! Want me to pin the route?',
    time: '08:45',
    tone: 'warm',
    alignment: 'left'
  },
  {
    name: 'Theo the Trekker',
    text: 'Just brewed orange peel tea. Ready for the afternoon brainstorm.',
    time: '09:10',
    tone: 'peach',
    alignment: 'right'
  },
  {
    name: 'Mira the Maker',
    text: 'Uploaded scenic illustrations for the campsite deck. Thoughts?',
    time: '09:24',
    tone: 'sunset',
    alignment: 'left'
  }
];

const avatarGradients: Record<string, string> = {
  warm: 'linear-gradient(135deg, #fb923c, #f97316)',
  peach: 'linear-gradient(135deg, #fbbf24, #fb923c)',
  sunset: 'linear-gradient(135deg, #f59e0b, #ea580c)'
};

const FocusFriends = () => {
  const cardBg = useColorModeValue('linear-gradient(160deg, #ffedd5, #fde68a)', 'gray.800');
  const border = useColorModeValue('rgba(251, 191, 36, 0.3)', 'gray.700');

  return (
    <Box
      bg={cardBg}
      borderRadius="22px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 6 }}
      boxShadow="0 12px 40px rgba(217, 119, 6, 0.18)"
      h="100%"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'320\' height=\'520\' viewBox=\'0 0 320 520\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg stroke=\'rgba(255,255,255,0.35)\' stroke-width=\'1.2\' fill=\'none\'%3E%3Cpath d=\'M20 120c24-36 48-36 72 0s48 36 72 0 48-36 72 0 48 36 72 0\'/%3E%3Cpath d=\'M-30 340c36-54 72-54 108 0s72 54 108 0 72-54 108 0\' opacity=\'0.6\'/%3E%3C/g%3E%3C/svg%3E')"
        opacity={0.6}
      />
      <Stack spacing={6} position="relative" h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            Campfire Chat
          </Text>
          <Text fontSize="sm" color="brand.900" opacity={0.7}>
            Catch the glow from your focus crew.
          </Text>
        </Stack>

        <VStack align="stretch" spacing={4} flex="1">
          {messages.map((message) => (
            <Bubble key={message.time} message={message} />
          ))}
        </VStack>

        <Stack spacing={3}>
          <HStack spacing={3} color="brand.600" fontWeight="semibold" cursor="pointer">
            <Icon as={FiUserPlus} />
            <Text>Invite a new adventurer</Text>
          </HStack>
          <HStack
            spacing={3}
            bg="rgba(255, 247, 237, 0.65)"
            borderRadius="18px"
            px={4}
            py={3}
            color="brand.700"
            fontSize="sm"
          >
            <Icon as={FiPaperclip} />
            <Text flex="1">Share a warm update...</Text>
            <Icon as={FiMessageCircle} />
          </HStack>
        </Stack>
      </Stack>
    </Box>
  );
};

interface BubbleProps {
  message: (typeof messages)[number];
}

const Bubble = ({ message }: BubbleProps) => {
  const alignSelf = message.alignment === 'right' ? 'flex-end' : 'flex-start';

  return (
    <Stack align={alignSelf} spacing={2} maxW="92%">
      <HStack spacing={3} align="flex-start">
        {message.alignment === 'left' && <AvatarBadge tone={message.tone} name={message.name} />}
        <Stack
          spacing={2}
          bg="rgba(255, 255, 255, 0.82)"
          borderRadius="20px"
          px={4}
          py={3}
          boxShadow="0 8px 24px rgba(217, 119, 6, 0.18)"
        >
          <Text fontWeight="semibold" color="brand.700">
            {message.name}
          </Text>
          <Text color="brand.900" opacity={0.75}>
            {message.text}
          </Text>
          <Text fontSize="xs" color="brand.500" textAlign="right">
            {message.time}
          </Text>
        </Stack>
        {message.alignment === 'right' && <AvatarBadge tone={message.tone} name={message.name} />}
      </HStack>
    </Stack>
  );
};

interface AvatarBadgeProps {
  tone: keyof typeof avatarGradients;
  name: string;
}

const AvatarBadge = ({ tone, name }: AvatarBadgeProps) => (
  <Box
    w="44px"
    h="44px"
    borderRadius="16px"
    bg={avatarGradients[tone]}
    display="flex"
    alignItems="center"
    justifyContent="center"
    color="white"
    fontWeight="bold"
    fontSize="xs"
    boxShadow="0 6px 18px rgba(217, 119, 6, 0.22)"
  >
    {name
      .split(' ')
      .map((segment) => segment[0])
      .join('')
      .slice(0, 2)}
  </Box>
);

export default FocusFriends;
