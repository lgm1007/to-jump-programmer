import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ALGO_TOPIC_MAP, type AlgoPattern } from '@/content';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

/** 알고리즘 문제 유형 목록의 한 줄. showTopic 이면 토픽 이름을 함께 보여준다 (북마크 등 토픽 밖 목록) */
export function AlgoPatternRow({ pattern, showTopic }: { pattern: AlgoPattern; showTopic?: boolean }) {
  const c = useColors();
  const read = useProgress((s) => !!s.algoPatterns[pattern.id]);
  return (
    <Card href={`/algorithm/pattern/${pattern.id}`} style={styles.row} tint="transparent">
      <View style={[styles.order, { backgroundColor: read ? c.successSoft : c.algoSoft }]}>
        {read ? (
          <Ionicons name="checkmark" size={16} color={c.success} />
        ) : (
          <Text variant="captionStrong" tint={c.algo}>
            {pattern.order}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {pattern.title}
        </Text>
        <Text variant="caption" color="textTertiary" numberOfLines={2}>
          {pattern.summary}
        </Text>
        <View style={styles.badges}>
          <DifficultyBadge level={pattern.difficulty} />
          {showTopic && <Badge label={ALGO_TOPIC_MAP[pattern.topicId]?.title ?? pattern.topicId} tone="algo" />}
          <Badge label={`구현 ${pattern.implementations.length}가지`} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 0, borderWidth: 0, shadowOpacity: 0 },
  order: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
});
