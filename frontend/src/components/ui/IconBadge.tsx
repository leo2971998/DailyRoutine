import { Flex, FlexProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { BADGE_TOKENS } from './designTokens';

interface IconBadgeProps extends FlexProps {
  icon: IconType;
}

const IconBadge = ({ icon: IconComponent, ...flexProps }: IconBadgeProps) => (
  <Flex
    align="center"
    justify="center"
    w="44px"
    h="44px"
    borderRadius={BADGE_TOKENS.radius}
    bgGradient={BADGE_TOKENS.gradient}
    color="white"
    boxShadow={BADGE_TOKENS.shadow}
    flexShrink={0}
    {...flexProps}
  >
    <IconComponent />
  </Flex>
);

export default IconBadge;
