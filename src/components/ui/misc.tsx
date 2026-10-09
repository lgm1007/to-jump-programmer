import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 20, color }: { name: IconName | string; size?: number; color?: string }) {
  const c = useColors();
  return <Ionicons name={name as IconName} size={size} color={color ?? c.text} />;
}

/** 원형 배경 아이콘 */
export function IconBadge({
  name,
  color,
  background,
  size = 40,
  iconSize,
}: {
  name: IconName | string;
  color: string;
  background: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={name as IconName} size={iconSize ?? Math.round(size * 0.5)} color={color} />
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
  style,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="title3">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="textTertiary">
            {subtitle}
          </Text>
        )}
      </View>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text variant="subhead" color="textTertiary">
            {action} ›
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** 목록 행 */
export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  chevron = true,
  style,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <PressableScale onPress={onPress} disabled={!onPress} scaleTo={0.99} style={[styles.row, style]} accessibilityRole={onPress ? 'button' : undefined}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textTertiary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
      {onPress && chevron && <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />}
    </PressableScale>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginLeft: inset }} />;
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tint,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tint?: string;
}) {
  const c = useColors();
  const activeColor = tint ?? c.primary;
  return (
    <Pressable
      onPress={() => {
        haptic('selection');
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? activeColor : c.surface,
          borderColor: selected ? activeColor : c.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {icon && <Ionicons name={icon} size={14} color={selected ? '#FFFFFF' : c.textSecondary} />}
      <Text variant="subhead" weight={selected ? '600' : '500'} tint={selected ? '#FFFFFF' : c.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  icon = 'sparkles',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <IconBadge name={icon} color={c.textTertiary} background={c.surfaceAlt} size={56} />
      <Text variant="headline" align="center">
        {title}
      </Text>
      {description && (
        <Text variant="callout" color="textTertiary" align="center">
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}

/** 작은 통계 표시 */
export function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="caption" color="textTertiary">
        {label}
      </Text>
      <Text variant="title3" tint={tint}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
});
