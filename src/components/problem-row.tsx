import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { topicLabel, type AlgoProblem } from '@/content';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export function ProblemRow({ problem }: { problem: AlgoProblem }) {
  const c = useColors();
  const record = useProgress((s) => s.problems[problem.id]);
  const status = record?.solved ? 'solved' : record ? 'tried' : 'new';
  return (
    <Card onPress={() => router.push(`/algorithm/problem/${problem.id}`)} style={styles.problemRow} tint="transparent">
      <Ionicons
        name={status === 'solved' ? 'checkmark-circle' : status === 'tried' ? 'ellipse-outline' : 'ellipse-outline'}
        size={22}
        color={status === 'solved' ? c.success : status === 'tried' ? c.warning : c.borderStrong}
      />
      <View style={{ flex: 1, gap: 5 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {problem.title}
        </Text>
        <View style={styles.badges}>
          <DifficultyBadge level={problem.level} prefix="Lv" />
          {problem.topics.slice(0, 3).map((t) => (
            <Badge key={t} label={topicLabel(t)} />
          ))}
          {status === 'tried' && <Badge label={`${record?.bestPassed}/${record?.total} 통과`} tone="warning" />}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
    </Card>
  );
}

const styles = StyleSheet.create({
  problemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 0, borderWidth: 0, shadowOpacity: 0 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
});
