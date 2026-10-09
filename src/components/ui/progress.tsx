import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useColors } from '@/theme/theme-provider';

import { Text } from './text';

export function ProgressBar({
  value,
  color,
  height = 6,
  track,
  style,
}: {
  /** 0~1 */
  value: number;
  color?: string;
  height?: number;
  track?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track ?? c.surfaceAlt }, style]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color ?? c.primary,
        }}
      />
    </View>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  color,
  track,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
}) {
  const c = useColors();
  const pct = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? c.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? c.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label !== undefined && (
        <Text variant={size >= 90 ? 'title2' : 'captionStrong'} weight="700">
          {label}
        </Text>
      )}
      {sublabel !== undefined && (
        <Text variant="small" color="textTertiary">
          {sublabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
});
