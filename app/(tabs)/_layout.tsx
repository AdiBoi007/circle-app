import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Button, Sheet, Text } from '@/components';
import { CircleAIIcon } from '@/components/icons/CircleAIIcon';
import { quickActions } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, shadows, spacing } from '@/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

type TabDef = {
  name: string;
  href: Href;
  label: string;
} & (
  | { circleAI: true }
  | { circleAI?: false; icon: IoniconName; iconActive: IoniconName }
);

// Exactly four primary tabs. Order defines left-to-right placement.
const TABS: TabDef[] = [
  { name: 'home', href: '/', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'ai', href: '/ai', label: 'Circle AI', circleAI: true },
  { name: 'care', href: '/care', label: 'Care', icon: 'heart-outline', iconActive: 'heart' },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  circleAI?: boolean;
  icon?: IoniconName;
  iconActive?: IoniconName;
};

const TabButton = forwardRef<View, TabButtonProps>(function TabButton(
  { isFocused, label, circleAI, icon, iconActive, ...props },
  ref,
) {
  const color = isFocused ? colors.blue : colors.textTertiary;
  const tabIcon = circleAI ? (
    <CircleAIIcon size={26} color={color} />
  ) : (
    <Ionicons name={isFocused ? iconActive : icon} size={24} color={color} />
  );

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(isFocused) }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
        {tabIcon}
      </View>
      <Text variant="caption" color={color} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { activeAccountId } = useAppState();
  const [quickOpen, setQuickOpen] = useState(false);
  const bottom = insets.bottom > 0 ? insets.bottom : spacing.md;
  const tabs = activeAccountId === 'savita'
    ? TABS.map((tab) => ({ ...tab, label: tab.name === 'home' ? 'My Health' : tab.name === 'ai' ? 'Ask Circle' : tab.label }))
    : TABS;
  const actions = activeAccountId === 'savita'
    ? [
        { id: 'ask-circle', title: 'Ask Circle', href: '/ai' as Href, icon: 'chatbubble-outline' as IoniconName },
        { id: 'upload', title: 'Add a report', href: '/savita-upload' as Href, icon: 'camera-outline' as IoniconName },
        { id: 'medicine', title: 'View medicines', href: '/medications' as Href, icon: 'medical-outline' as IoniconName },
      ]
    : quickActions.map((action) => ({
        ...action,
        href: (action.id === 'tell-circle' ? '/ai?mode=logging' : `/quick-add/${action.id}`) as Href,
        icon: (action.id === 'tell-circle' ? 'chatbubble-outline' : action.id === 'upload' ? 'cloud-upload-outline' : action.id === 'reading' ? 'pulse-outline' : action.id === 'medication' ? 'medical-outline' : action.id === 'reminder' ? 'notifications-outline' : action.id === 'task' ? 'checkbox-outline' : 'heart-outline') as IoniconName,
      }));

  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <TabList style={[styles.bar, { marginBottom: bottom }]}>
        {tabs.slice(0, 2).map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton label={tab.label} {...(tab.circleAI
              ? { circleAI: true }
              : { icon: tab.icon, iconActive: tab.iconActive })} />
          </TabTrigger>
        ))}
        <Pressable
          onPress={() => setQuickOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Quick add"
          accessibilityHint="Opens quick actions"
          style={({ pressed }) => [styles.quickAddItem, pressed && styles.pressed]}
        >
          <View style={styles.quickAddCircle}>
            <Ionicons name="add" size={27} color={colors.textPrimary} />
          </View>
        </Pressable>
        {tabs.slice(2).map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton label={tab.label} {...(tab.circleAI
              ? { circleAI: true }
              : { icon: tab.icon, iconActive: tab.iconActive })} />
          </TabTrigger>
        ))}
      </TabList>
      <Sheet
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
        title="Quick add"
        footer={<Button title="Close" variant="secondary" onPress={() => setQuickOpen(false)} />}
      >
        <View style={styles.quickGrid}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              onPress={() => {
                setQuickOpen(false);
                router.push(action.href);
              }}
              style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={action.icon} size={20} color={colors.blue} />
              </View>
              <Text variant="subhead" style={styles.quickText}>{action.title}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slot: {
    flex: 1,
    minWidth: 0,
  },
  bar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.cardLarge,
    ...shadows.lg,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  quickAddItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    ...shadows.sm,
  },
  iconWrap: {
    width: 52,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.blueTint,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickItem: { width: '47%', minHeight: 96, backgroundColor: colors.surfaceMuted, borderRadius: radius.input, padding: spacing.lg, gap: spacing.md },
  quickIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  quickText: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
});
