import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ALGO_PATTERNS, ALGO_TOPICS, ALL_ALGO_PATTERNS } from '@/content';
import { AdSlot } from '@/features/ads';
import { ALL_ALGO_QUESTION_IDS, algoTopicQuestionIds, quizSetStats } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export default function AlgorithmTab() {
  const c = useColors();
  const quiz = useProgress((s) => s.quiz);
  const algoPatterns = useProgress((s) => s.algoPatterns);
  const readTotal = ALL_ALGO_PATTERNS.filter((p) => algoPatterns[p.id]).length;
  const quizTotal = quizSetStats(ALL_ALGO_QUESTION_IDS, quiz);

  return (
    <Screen edges={['top']}>
      <View style={{ gap: 4, paddingTop: spacing.sm }}>
        <Text variant="title1" heading={1}>
          알고리즘
        </Text>
        <Text variant="callout" color="textTertiary">
          이론을 익히고, 자주 나오는 유형을 5개 언어 구현 예제로 비교해요
        </Text>
      </View>

      <Card style={styles.summary}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="caption" color="textTertiary">
            유형 학습
          </Text>
          <Text variant="title2">
            {readTotal}
            <Text variant="callout" color="textTertiary">
              {' '}
              / {ALL_ALGO_PATTERNS.length}
            </Text>
          </Text>
          <ProgressBar value={ALL_ALGO_PATTERNS.length ? readTotal / ALL_ALGO_PATTERNS.length : 0} color={c.algo} height={6} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="caption" color="textTertiary">
            개념 퀴즈
          </Text>
          <Text variant="title2">
            {quizTotal.attempted}
            <Text variant="callout" color="textTertiary">
              {' '}
              / {quizTotal.total}
            </Text>
          </Text>
          <ProgressBar value={quizTotal.progress} color={c.algo} height={6} />
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        {ALGO_TOPICS.map((t) => {
          const patterns = ALGO_PATTERNS[t.id] ?? [];
          const read = patterns.filter((p) => algoPatterns[p.id]).length;
          const stats = quizSetStats(algoTopicQuestionIds(t.id), quiz);
          const progress = patterns.length ? read / patterns.length : stats.progress;
          return (
            <Card key={t.id} href={`/algorithm/topic/${t.id}`} style={styles.topicCard}>
              <IconBadge name={t.icon} color={c.algo} background={c.algoSoft} size={44} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ gap: 2 }}>
                  <Text variant="bodyStrong">{t.title}</Text>
                  <Text variant="caption" color="textTertiary" numberOfLines={1}>
                    {t.description}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <ProgressBar value={progress} color={c.algo} style={{ flex: 1 }} height={5} />
                  <Text variant="small" color="textTertiary">
                    {patterns.length ? `유형 ${read}/${patterns.length} · ` : ''}퀴즈 {stats.attempted}/{stats.total}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
            </Card>
          );
        })}
      </View>
      <AdSlot />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: spacing.lg },
  topicCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
