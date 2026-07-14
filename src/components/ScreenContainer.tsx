import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** Scrollable body (default) vs. a fixed full-height view. */
  scroll?: boolean;
  /** Apply the standard horizontal gutter to the content. */
  gutter?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra bottom space so content clears the floating tab bar. */
  bottomInset?: number;
};

/**
 * The base screen wrapper: warm app background, safe-area handling and a
 * consistent gutter. Every tab root renders inside one of these.
 */
export function ScreenContainer({
  children,
  scroll = true,
  gutter = true,
  edges = ['top'],
  style,
  contentStyle,
  bottomInset = spacing.giant,
}: Props) {
  const padding = gutter ? screenPadding : 0;

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            { paddingHorizontal: padding, paddingBottom: bottomInset },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingHorizontal: padding }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
});
