import { Platform, type ViewStyle } from 'react-native';

import { palette } from './colors';

/**
 * Soft, restrained elevation. Shadows are warm-toned (near-black) and low
 * opacity so cards feel lifted, never heavy. Android uses `elevation`.
 */

type Elevation = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOpacity' | 'shadowRadius' | 'shadowOffset' | 'elevation'
>;

const make = (
  opacity: number,
  blur: number,
  offsetY: number,
  elevation: number,
): Elevation =>
  Platform.select({
    android: { elevation, shadowColor: palette.black },
    default: {
      shadowColor: palette.black,
      shadowOpacity: opacity,
      shadowRadius: blur,
      shadowOffset: { width: 0, height: offsetY },
    },
  }) as Elevation;

export const shadows = {
  none: make(0, 0, 0, 0),
  /** Resting card lift. */
  sm: make(0.05, 10, 3, 2),
  /** Primary content cards. */
  md: make(0.07, 20, 8, 5),
  /** Sheets, floating surfaces, pressed emphasis. */
  lg: make(0.12, 32, 16, 12),
} as const;

export type ShadowToken = keyof typeof shadows;
