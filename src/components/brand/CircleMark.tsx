import Svg, { Circle, Path, G } from 'react-native-svg';

import { colors } from '@/theme';

export type CircleMarkProps = {
  /** Rendered width & height in px. Works crisply from 24px up to splash sizes. */
  size?: number;
  /** Stroke color for the outline, stem and leaves. */
  color?: string;
  /** Optional very subtle leaf fill. Defaults to none. */
  fill?: string;
  /** Stroke weight in viewBox units (canvas is 48×48). */
  strokeWidth?: number;
  /** Hide the outer ring (used for tight/compact placements). */
  showRing?: boolean;
};

/**
 * The Circle mark: a calm botanical/family-tree glyph — a thin ring holding a
 * central stem with one small leaf at the crown and four rounded leaves
 * arranged symmetrically around it. Deliberately not a cross, heart-rate line
 * or medical snake. Pure vector so it stays sharp at every size.
 */

// A rounded almond leaf whose base sits at (0,0) and tip points straight up
// at (0,-len). Rotating/translating places each leaf around the stem.
function leaf(len: number, halfWidth: number): string {
  const c1 = (len * 0.28).toFixed(2);
  const c2 = (len * 0.72).toFixed(2);
  const l = len.toFixed(2);
  const w = halfWidth.toFixed(2);
  return `M 0 0 C ${w} -${c1} ${w} -${c2} 0 -${l} C -${w} -${c2} -${w} -${c1} 0 0 Z`;
}

export function CircleMark({
  size = 32,
  color = colors.textPrimary,
  fill = 'none',
  strokeWidth = 2,
  showRing = true,
}: CircleMarkProps) {
  const leafProps = {
    stroke: color,
    strokeWidth,
    fill,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {showRing && (
        <Circle cx={24} cy={24} r={21.5} stroke={color} strokeWidth={strokeWidth} fill="none" />
      )}

      {/* Central stem */}
      <Path
        d="M24 39 L24 14.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Crown leaf, pointing up */}
      <Path d={leaf(8.5, 2.9)} transform="translate(24 15.5)" {...leafProps} />

      {/* Upper pair */}
      <Path d={leaf(11, 4)} transform="translate(24 21) rotate(40)" {...leafProps} />
      <Path d={leaf(11, 4)} transform="translate(24 21) rotate(-40)" {...leafProps} />

      {/* Lower pair, angled more outward */}
      <G>
        <Path d={leaf(10.5, 3.8)} transform="translate(24 28.5) rotate(68)" {...leafProps} />
        <Path d={leaf(10.5, 3.8)} transform="translate(24 28.5) rotate(-68)" {...leafProps} />
      </G>
    </Svg>
  );
}
