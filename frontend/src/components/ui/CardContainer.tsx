import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import { CARD_TOKENS } from './designTokens';

type CardSurface = 'translucent' | 'solid' | 'muted';

export interface CardContainerProps extends BoxProps {
  surface?: CardSurface;
}

const surfaceBackground: Record<CardSurface, string> = {
  translucent: CARD_TOKENS.translucentBg,
  solid: 'linear-gradient(160deg, rgba(253, 186, 116, 0.22), rgba(249, 115, 22, 0.16))',
  muted: 'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 237, 213, 0.85))'
};

const CardContainer = ({
  children,
  surface = 'translucent',
  ...boxProps
}: PropsWithChildren<CardContainerProps>) => {
  const background = useColorModeValue(surfaceBackground[surface], 'gray.800');
  const borderColor = useColorModeValue(CARD_TOKENS.borderColor, 'rgba(255, 255, 255, 0.08)');

  return (
    <Box
      borderRadius={CARD_TOKENS.borderRadius}
      boxShadow={CARD_TOKENS.shadow}
      borderWidth={surface === 'solid' ? 0 : 1}
      borderColor={borderColor}
      px={CARD_TOKENS.paddingX}
      py={CARD_TOKENS.paddingY}
      bg={background}
      position="relative"
      overflow="hidden"
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export default CardContainer;
