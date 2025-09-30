import {
  Avatar,
  AvatarGroup,
  Box,
  Divider,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { FiMessageCircle, FiUserPlus } from 'react-icons/fi';

const friends = [
  { name: 'Jane Cooper', role: 'Design Lead', status: 'Focus Sprint', color: 'purple' },
  { name: 'Arlene McCoy', role: 'Product Ops', status: 'Reviewing flows', color: 'teal' },
  { name: 'Courtney Henry', role: 'UX Writer', status: 'Storyboarding', color: 'orange' }
];

const FocusFriends = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.300');

  return (
    <Box
      bg={cardBg}
      borderRadius="28px"
      borderWidth="1px"
      borderColor={border}
      p={{ base: 5, md: 6 }}
      boxShadow="xl"
      h="100%"
    >
      <Stack spacing={5} h="100%">
        <Stack spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            Focus Circle
          </Text>
          <Text fontSize="sm" color="gray.500">
            Collaborators keeping pace with you today.
          </Text>
        </Stack>

        <AvatarGroup size="md" max={3}>
          {friends.map((friend) => (
            <Avatar key={friend.name} name={friend.name} bg={`${friend.color}.400`} color="white" />
          ))}
        </AvatarGroup>

        <Stack spacing={4} divider={<Divider borderColor={dividerColor} />}
          flex="1"
        >
          {friends.map((friend) => (
            <Stack key={friend.name} spacing={1}>
              <HStack justify="space-between">
                <Text fontWeight="semibold">{friend.name}</Text>
                <Icon as={FiMessageCircle} color="purple.400" />
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {friend.role}
              </Text>
              <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.2em">
                {friend.status}
              </Text>
            </Stack>
          ))}
        </Stack>

          <HStack spacing={3} color="purple.500" fontWeight="semibold" cursor="pointer">
            <Icon as={FiUserPlus} />
            <Text>Invite teammate</Text>
          </HStack>
      </Stack>
    </Box>
  );
};

export default FocusFriends;
