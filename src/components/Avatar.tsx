import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { profilePictureFor } from '@/data/profilePictures';
import { accents, colors, radius, type AccentName } from '@/theme';

type Props = {
  name: string;
  accent?: AccentName;
  size?: number;
  source?: ImageSourcePropType;
  /** Draws a strong ring to indicate the active/selected member. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular local profile picture. The selected state adds a distinct outer
 * ring for the family selector.
 */
export function Avatar({ name, accent = 'blue', size = 56, source, selected = false, style }: Props) {
  const a = accents[accent];
  const ringGap = 3;
  const ringWidth = selected ? 2.5 : 0;
  const outer = size + (ringGap + ringWidth) * 2;

  return (
    <View
      style={[
        {
          width: outer,
          height: outer,
          borderRadius: radius.full,
          borderWidth: ringWidth,
          borderColor: selected ? colors.textPrimary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: a.tint,
          },
        ]}
      >
        <Image
          source={source ?? profilePictureFor(name)}
          accessible={false}
          resizeMode="cover"
          style={{ width: size, height: size }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
