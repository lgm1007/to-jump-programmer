import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { Text } from './text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'algo' | 'review' | 'cs';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', icon, size = 'sm', style }: BadgeProps) {
  const c = useColors();
  const map: Record<BadgeTone, [string, string]> = {
    neutral: [c.surfaceAlt, c.textSecondary],
    primary: [c.primarySoft, c.primary],
    success: [c.successSoft, c.success],
    danger: [c.dangerSoft, c.danger],
    warning: [c.warningSoft, c.warning],
    algo: [c.algoSoft, c.algo],
    review: [c.reviewSoft, c.review],
    cs: [c.csSoft, c.cs],
  };
  const [bg, fg] = map[tone];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, paddingVertical: size === 'sm' ? 3 : 5, paddingHorizontal: size === 'sm' ? 7 : 10 },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={size === 'sm' ? 11 : 13} color={fg} />}
      <Text variant={size === 'sm' ? 'small' : 'captionStrong'} tint={fg} weight="600">
        {label}
      </Text>
    </View>
  );
}

const DIFFICULTY_LABEL = ['', '기초', '중급', '심화'];
const DIFFICULTY_TONE: BadgeTone[] = ['neutral', 'success', 'warning', 'danger'];

export function DifficultyBadge({ level, prefix }: { level: 1 | 2 | 3; prefix?: 'Lv' }) {
  return (
    <Badge
      label={prefix === 'Lv' ? `Lv.${level}` : DIFFICULTY_LABEL[level]}
      tone={DIFFICULTY_TONE[level]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
