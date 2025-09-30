export const CARD_TOKENS = {
  borderRadius: '24px',
  shadow: '0 18px 48px rgba(194, 65, 12, 0.18)',
  borderColor: 'rgba(251, 191, 36, 0.35)',
  paddingX: { base: 5, md: 8 } as const,
  paddingY: { base: 6, md: 8 } as const,
  translucentBg: 'linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(255, 247, 237, 0.92))',
  elevatedBg: 'linear-gradient(150deg, rgba(251, 211, 141, 0.24), rgba(249, 115, 22, 0.16))'
} as const;

export const BADGE_TOKENS = {
  radius: '16px',
  shadow: '0 10px 24px rgba(217, 119, 6, 0.22)',
  gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 1), rgba(234, 88, 12, 1))'
} as const;
