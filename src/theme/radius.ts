/**
 * Border-radius tokens. Thick, soft, rounded shape language:
 * - large cards 24–28
 * - buttons 18–22
 * - inputs ~18
 * - pills fully rounded
 */

export const radius = {
  sm: 12,
  md: 16,
  input: 14,
  button: 999,
  card: 20,
  cardLarge: 28,
  pill: 999,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
