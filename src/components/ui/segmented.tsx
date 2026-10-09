import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { Text } from './text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, scheme } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: scheme === 'dark' ? colors.surfaceAlt : '#E9ECEF' }, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                haptic('selection');
                onChange(o.value);
              }
            }}
            style={[
              styles.item,
              active && {
                backgroundColor: scheme === 'dark' ? colors.surfacePressed : colors.surface,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
              },
            ]}>
            <Text variant="subhead" weight={active ? '700' : '500'} color={active ? 'text' : 'textTertiary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 4, borderRadius: radius.md, gap: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: radius.sm + 2 },
});
