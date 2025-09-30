export const CARD_TOKENS = {
  borderRadius: '24px',
  shadow: 'shadow.card',
  borderColor: 'border.subtle',
  paddingX: { base: 5, md: 8 } as const,
  paddingY: { base: 6, md: 8 } as const,
  translucentBg: 'surface.translucent',
  elevatedBg: 'surface.solid',
  mutedBg: 'surface.muted'
} as const;

export const BADGE_TOKENS = {
  radius: '16px',
  shadow: 'shadow.accent',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(234, 88, 12, 1))'
} as const;
