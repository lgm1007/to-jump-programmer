import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AlgoPatternRow } from '@/components/algo-pattern-row';
import { RichText } from '@/components/rich-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider, EmptyState, IconBadge, SectionHeader } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { ALGO_PATTERNS, ALGO_QUIZ, ALGO_TOPIC_MAP, type AlgoPattern } from '@/content';
import { AdSlot } from '@/features/ads';
import { algoTopicQuestionIds, quizSetStats, wrongQuestionIds } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

type Tab = 'theory' | 'patterns';

export default function TopicScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = ALGO_TOPIC_MAP[id];
  const content = ALGO_QUIZ[id];
  const patterns = ALGO_PATTERNS[id] ?? [];
  const quiz = useProgress((s) => s.quiz);
  const algoPatterns = useProgress((s) => s.algoPatterns);
  const readCount = patterns.filter((p) => algoPatterns[p.id]).length;
  // 처음 들어오면 개념 정리부터, 유형을 하나라도 공부했으면 유형 목록부터 보여준다
  const [tab, setTab] = useState<Tab>(() => (patterns.length && readCount > 0 ? 'patterns' : 'theory'));

  if (!topic) {
    return (
      <Screen>
        <EmptyState title="토픽을 찾을 수 없어요" />
      </Screen>
    );
  }

  const ids = algoTopicQuestionIds(id);
  const stats = quizSetStats(ids, quiz);
  const wrong = wrongQuestionIds(quiz, (qid) => ids.includes(qid));
  const showPatterns = patterns.length > 0 && tab === 'patterns';

  return (
    <Screen
      footer={
        <>
          {wrong.length > 0 && (
            <Button
              title={`오답 ${wrong.length}`}
              variant="secondary"
              icon="refresh"
              onPress={() => router.push({ pathname: '/quiz', params: { mode: 'ids', ids: wrong.join(','), title: `${topic.title} 오답` } })}
            />
          )}
          <Button
            title={stats.attempted ? `퀴즈 다시 풀기 (${ids.length}문제)` : `개념 퀴즈 풀기 (${ids.length}문제)`}
            icon="flash"
            style={{ flex: 1 }}
            disabled={!ids.length}
            tint={c.algo}
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'topic', id } })}
          />
        </>
      }>
      <Stack.Screen options={{ title: topic.title }} />
      <View style={styles.head}>
        <IconBadge name={topic.icon} color={c.algo} background={c.algoSoft} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title2" heading={1}>
            {topic.title}
          </Text>
          <Text variant="caption" color="textTertiary">
            {topic.description}
          </Text>
        </View>
      </View>

      {(patterns.length > 0 || stats.attempted > 0) && (
        <Card style={styles.stats}>
          {patterns.length > 0 && (
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="caption" color="textTertiary">
                유형 학습
              </Text>
              <Text variant="title3">
                {readCount}/{patterns.length}
              </Text>
              <ProgressBar value={readCount / patterns.length} color={c.algo} height={5} />
            </View>
          )}
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="caption" color="textTertiary">
              개념 퀴즈
            </Text>
            <Text variant="title3">
              {stats.attempted}/{stats.total}
            </Text>
            <Text variant="small" tint={c.algo}>
              {stats.attempted ? `정답률 ${Math.round(stats.accuracy * 100)}%` : '아직 안 풀었어요'}
            </Text>
          </View>
        </Card>
      )}

      {patterns.length > 0 && (
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'theory', label: '개념 정리' },
            { value: 'patterns', label: `유형별 예제 ${patterns.length}` },
          ]}
        />
      )}

      {showPatterns ? (
        <PatternList patterns={patterns} />
      ) : (
        <>
          <Card style={{ gap: spacing.md }}>
            {content?.primer ? (
              <RichText text={content.primer} variant="callout" />
            ) : (
              <Text variant="callout" color="textTertiary">
                개념 정리를 준비하고 있어요.
              </Text>
            )}
          </Card>
          {/* 개념 정리를 읽고 바로 유형으로 넘어갈 수 있게 목록을 이어서 보여준다 (정적 토픽 페이지와 같은 구성) */}
          {patterns.length > 0 && (
            <>
              <SectionHeader title={`자주 나오는 유형 ${patterns.length}가지`} subtitle="유형마다 5개 언어 구현 예제가 있어요" />
              <PatternList patterns={patterns} />
            </>
          )}
        </>
      )}

      <AdSlot />
    </Screen>
  );
}

function PatternList({ patterns }: { patterns: AlgoPattern[] }) {
  return (
    <Card padded={false}>
      {patterns.map((p, i) => (
        <View key={p.id}>
          {i > 0 && <Divider inset={spacing.lg} />}
          <AlgoPatternRow pattern={p} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.lg },
});
