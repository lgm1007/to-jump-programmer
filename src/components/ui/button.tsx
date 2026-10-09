import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** 버튼 배경색 직접 지정 (트랙 색상 등) */
  tint?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const HEIGHT: Record<ButtonSize, number> = { lg: 54, md: 46, sm: 36 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  disabled,
  loading,
  fullWidth,
  tint,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const c = useColors();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: tint ?? c.primary, fg: '#FFFFFF' },
    secondary: { bg: c.surfaceAlt, fg: c.text, border: c.border },
    ghost: { bg: 'transparent', fg: tint ?? c.primary },
    danger: { bg: c.dangerSoft, fg: c.danger },
    success: { bg: c.success, fg: '#FFFFFF' },
  };
  const { bg, fg, border } = palette[variant];
  const inactive = disabled || loading;
  const fontVariant = size === 'sm' ? 'captionStrong' : size === 'md' ? 'subhead' : 'bodyStrong';
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: bg,
          borderRadius: size === 'sm' ? radius.sm : radius.md,
          paddingHorizontal: size === 'sm' ? 12 : 18,
          opacity: disabled ? 0.45 : 1,
        },
        border && { borderWidth: StyleSheet.hairlineWidth, borderColor: border },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={fg} />}
          <Text variant={fontVariant} tint={fg} weight="600" numberOfLines={1}>
            {title}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={size === 'sm' ? 15 : 18} color={fg} />}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
