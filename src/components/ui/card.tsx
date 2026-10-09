import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { PressableScale } from './pressable-scale';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  /** 배경색 직접 지정 */
  tint?: string;
  accessibilityLabel?: string;
}

export function Card({ onPress, padded = true, style, tint, children, accessibilityLabel, ...rest }: CardProps) {
  const { colors, scheme } = useTheme();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: tint ?? colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: scheme === 'dark' ? 0 : 0.04,
      borderColor: scheme === 'dark' ? colors.border : 'transparent',
    },
    padded && styles.padded,
    style,
  ];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={base} accessibilityRole="button" accessibilityLabel={accessibilityLabel} {...rest}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 0,
  },
  padded: { padding: spacing.lg },
});
