import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ProblemRow } from '@/components/problem-row';
import { Card } from '@/components/ui/card';
import { Chip, Divider, EmptyState, IconBadge } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { ALGO_TOPICS, ALL_PROBLEMS, topicLabel } from '@/content';
import { AdSlot } from '@/features/ads';
import { algoTopicQuestionIds, quizSetStats } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

type Tab = 'concept' | 'problems';
type LevelFilter = 0 | 1 | 2 | 3;

export default function AlgorithmTab() {
  const c = useColors();
  const [tab, setTab] = useState<Tab>('concept');
  const quiz = useProgress((s) => s.quiz);
  const problems = useProgress((s) => s.problems);
  const [level, setLevel] = useState<LevelFilter>(0);
  const [topic, setTopic] = useState<string | null>(null);

  const usedTopics = useMemo(() => {
    const set = new Set<string>();
    ALL_PROBLEMS.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return [...set];
  }, []);

  const filtered = ALL_PROBLEMS.filter((p) => (level === 0 || p.level === level) && (!topic || p.topics.includes(topic)));
  const solvedCount = ALL_PROBLEMS.filter((p) => problems[p.id]?.solved).length;

  return (
    <Screen edges={['top']}>
      <View style={{ gap: 4, paddingTop: spacing.sm }}>
        <Text variant="title1">알고리즘</Text>
        <Text variant="callout" color="textTertiary">
          개념을 퀴즈로 다지고, 실제 문제를 코드로 풀어봐요
        </Text>
      </View>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'concept', label: '개념 학습' },
          { value: 'problems', label: `코딩 문제 ${ALL_PROBLEMS.length}` },
        ]}
      />

      {tab === 'concept' ? (
        <View style={{ gap: spacing.md }}>
          {ALGO_TOPICS.map((t) => {
            const stats = quizSetStats(algoTopicQuestionIds(t.id), quiz);
            const related = ALL_PROBLEMS.filter((p) => p.topics.includes(t.id)).length;
            return (
              <Card key={t.id} onPress={() => router.push(`/algorithm/topic/${t.id}`)} style={styles.topicCard}>
                <IconBadge name={t.icon} color={c.algo} background={c.algoSoft} size={44} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ gap: 2 }}>
                    <Text variant="bodyStrong">{t.title}</Text>
                    <Text variant="caption" color="textTertiary" numberOfLines={1}>
                      {t.description}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <ProgressBar value={stats.progress} color={c.algo} style={{ flex: 1 }} height={5} />
                    <Text variant="small" color="textTertiary">
                      퀴즈 {stats.attempted}/{stats.total}
                      {related ? ` · 문제 ${related}` : ''}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
              </Card>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.summary}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="caption" color="textTertiary">
                해결한 문제
              </Text>
              <Text variant="title2">
                {solvedCount}
                <Text variant="callout" color="textTertiary">
                  {' '}
                  / {ALL_PROBLEMS.length}
                </Text>
              </Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <ProgressBar value={ALL_PROBLEMS.length ? solvedCount / ALL_PROBLEMS.length : 0} color={c.algo} height={8} />
            </View>
          </Card>

          <View style={styles.chips}>
            {([0, 1, 2, 3] as LevelFilter[]).map((l) => (
              <Chip key={l} label={l === 0 ? '전체' : `Lv.${l}`} selected={level === l} onPress={() => setLevel(l)} />
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="모든 유형" selected={!topic} onPress={() => setTopic(null)} />
            {usedTopics.map((t) => (
              <Chip key={t} label={topicLabel(t)} selected={topic === t} onPress={() => setTopic(topic === t ? null : t)} />
            ))}
          </ScrollView>

          <Card padded={false}>
            {filtered.length === 0 ? (
              <EmptyState icon="search-outline" title="조건에 맞는 문제가 없어요" />
            ) : (
              filtered.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider inset={spacing.lg} />}
                  <ProblemRow problem={p} />
                </View>
              ))
            )}
          </Card>
        </View>
      )}
      <AdSlot />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topicCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
