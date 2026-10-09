import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ProblemRow } from '@/components/problem-row';
import { RichText } from '@/components/rich-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider, EmptyState, IconBadge, SectionHeader } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ALGO_QUIZ, ALGO_TOPIC_MAP, ALL_PROBLEMS } from '@/content';
import { algoTopicQuestionIds, quizSetStats, wrongQuestionIds } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export default function TopicScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = ALGO_TOPIC_MAP[id];
  const content = ALGO_QUIZ[id];
  const quiz = useProgress((s) => s.quiz);

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
  const related = ALL_PROBLEMS.filter((p) => p.topics.includes(id));

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
          <Text variant="title2">{topic.title}</Text>
          <Text variant="caption" color="textTertiary">
            {topic.description}
          </Text>
        </View>
      </View>

      {stats.attempted > 0 && (
        <Card style={styles.stats}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textTertiary">
              푼 문제
            </Text>
            <Text variant="title3">
              {stats.attempted}/{stats.total}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textTertiary">
              현재 정답률
            </Text>
            <Text variant="title3" tint={c.algo}>
              {Math.round(stats.accuracy * 100)}%
            </Text>
          </View>
        </Card>
      )}

      <SectionHeader title="개념 정리" />
      <Card style={{ gap: spacing.md }}>
        {content?.primer ? (
          <RichText text={content.primer} variant="callout" />
        ) : (
          <Text variant="callout" color="textTertiary">
            개념 정리를 준비하고 있어요.
          </Text>
        )}
      </Card>

      {related.length > 0 && (
        <>
          <SectionHeader title="이 개념으로 풀어볼 문제" subtitle={`${related.length}문제`} />
          <Card padded={false}>
            {related.map((p, i) => (
              <View key={p.id}>
                {i > 0 && <Divider inset={spacing.lg} />}
                <ProblemRow problem={p} />
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.lg },
});
