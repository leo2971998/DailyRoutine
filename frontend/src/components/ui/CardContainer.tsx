import { Box, BoxProps } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import { CARD_TOKENS } from './designTokens';

type CardSurface = 'translucent' | 'solid' | 'muted';

export interface CardContainerProps extends BoxProps {
  surface?: CardSurface;
}

const surfaceBackground: Record<CardSurface, string> = {
  translucent: CARD_TOKENS.translucentBg,
  solid: CARD_TOKENS.elevatedBg,
  muted: CARD_TOKENS.mutedBg
};

const CardContainer = ({
  children,
  surface = 'translucent',
  ...boxProps
}: PropsWithChildren<CardContainerProps>) => {
  return (
    <Box
      borderRadius={CARD_TOKENS.borderRadius}
      boxShadow={CARD_TOKENS.shadow}
      borderWidth={surface === 'solid' ? 0 : 1}
      borderColor={CARD_TOKENS.borderColor}
      px={CARD_TOKENS.paddingX}
      py={CARD_TOKENS.paddingY}
      bg={surfaceBackground[surface]}
      position="relative"
      overflow="hidden"
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export default CardContainer;
