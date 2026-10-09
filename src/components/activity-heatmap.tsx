import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays, dayKey } from '@/lib/date';
import { useTheme } from '@/theme/theme-provider';

import { Text } from './ui/text';

const WEEKS = 15;
const DAY_LABELS = ['일', '', '화', '', '목', '', '토'];

/** 최근 15주 학습 기록 (GitHub 잔디 스타일) */
export function ActivityHeatmap({ activity, goal }: { activity: Record<string, number>; goal: number }) {
  const { colors, scheme } = useTheme();
  const columns = useMemo(() => {
    const today = new Date();
    const start = addDays(today, -(WEEKS * 7 - 1) - today.getDay());
    const cols: { key: string; count: number; future: boolean }[][] = [];
    for (let w = 0; w < WEEKS + 1; w++) {
      const col: { key: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = dayKey(date);
        col.push({ key, count: activity[key] ?? 0, future: date > today });
      }
      cols.push(col);
    }
    return cols;
  }, [activity]);

  const level = (n: number) => {
    if (n <= 0) return 0;
    if (n < goal * 0.34) return 1;
    if (n < goal * 0.67) return 2;
    if (n < goal) return 3;
    return 4;
  };
  const shades =
    scheme === 'dark'
      ? [colors.surfaceAlt, '#1E3A5F', '#245B9E', '#2F7BE0', '#4D94FF']
      : [colors.surfaceAlt, '#CFE3FF', '#93C0FF', '#5A9BFA', '#3182F6'];

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        <View style={styles.labels}>
          {DAY_LABELS.map((l, i) => (
            <Text key={i} variant="small" color="textTertiary" style={styles.label}>
              {l}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {columns.map((col, i) => (
            <View key={i} style={styles.col}>
              {col.map((cell) => (
                <View
                  key={cell.key}
                  accessibilityLabel={`${cell.key} 학습 ${cell.count}개`}
                  style={[styles.cell, { backgroundColor: cell.future ? 'transparent' : shades[level(cell.count)] }]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.legend}>
        <Text variant="small" color="textTertiary">
          적음
        </Text>
        {shades.map((s, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: s }]} />
        ))}
        <Text variant="small" color="textTertiary">
          목표 달성
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  labels: { gap: 3, paddingTop: 0 },
  label: { height: 13, lineHeight: 13, fontSize: 10 },
  grid: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  col: { gap: 3 },
  cell: { width: 13, height: 13, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  legendCell: { width: 11, height: 11, borderRadius: 3 },
});
