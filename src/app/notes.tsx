import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Inline, RichText } from '@/components/rich-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, EmptyState } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { ALGO_TOPIC_MAP, CS_CATEGORY_MAP, QUESTION_MAP, QUESTION_SOURCE } from '@/content';
import { wrongQuestionIds } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

type Filter = 'all' | 'algo' | 'cs';
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function NotesScreen() {
  const c = useColors();
  const quiz = useProgress((s) => s.quiz);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const all = wrongQuestionIds(quiz);
  const ids = all.filter((id) => filter === 'all' || QUESTION_SOURCE[id] === filter);

  return (
    <Screen
      footer={
        ids.length > 0 ? (
          <Button
            title={`${ids.length}문제 다시 풀기`}
            icon="refresh"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'ids', ids: ids.join(','), title: '오답노트 복습' } })}
          />
        ) : undefined
      }>
      <Stack.Screen options={{ title: '오답노트' }} />
      <Text variant="callout" color="textTertiary">
        가장 최근 풀이에서 틀린 문제가 모여요. 다시 맞히면 자동으로 빠져요.
      </Text>
      <View style={styles.chips}>
        <Chip label={`전체 ${all.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip
          label={`알고리즘 ${all.filter((id) => QUESTION_SOURCE[id] === 'algo').length}`}
          selected={filter === 'algo'}
          onPress={() => setFilter('algo')}
        />
        <Chip
          label={`CS ${all.filter((id) => QUESTION_SOURCE[id] === 'cs').length}`}
          selected={filter === 'cs'}
          onPress={() => setFilter('cs')}
        />
      </View>
      {ids.length === 0 ? (
        <EmptyState icon="happy-outline" title="오답노트가 비어 있어요" description="틀린 문제가 생기면 여기에서 다시 풀 수 있어요." />
      ) : (
        ids.map((id) => {
          const q = QUESTION_MAP[id];
          const rec = quiz[id];
          const expanded = open === id;
          const label =
            QUESTION_SOURCE[id] === 'algo' ? ALGO_TOPIC_MAP[q.categoryId]?.title : CS_CATEGORY_MAP[q.categoryId]?.title;
          const answer = q.type === 'mcq' ? `${LETTERS[q.answer]}. ${q.choices[q.answer]}` : q.answer ? 'O' : 'X';
          return (
            <Card key={id} onPress={() => setOpen(expanded ? null : id)} style={{ gap: spacing.sm }}>
              <View style={styles.meta}>
                <Badge label={label ?? ''} tone={QUESTION_SOURCE[id] === 'algo' ? 'algo' : 'cs'} />
                <Badge label={`${rec.attempts}번 풀이 · ${rec.correct}번 정답`} />
                <View style={{ flex: 1 }} />
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
              </View>
              {expanded ? (
                <RichText text={q.prompt} variant="callout" />
              ) : (
                <Inline text={q.prompt.split('\n')[0]} variant="callout" numberOfLines={2} />
              )}
              {expanded && (
                <View style={{ gap: spacing.sm }}>
                  <Inline text={`정답: ${answer}`} variant="captionStrong" color={c.success} />
                  <RichText text={q.explanation} variant="caption" />
                  <Button
                    title="이 문제만 다시 풀기"
                    size="sm"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/quiz', params: { mode: 'ids', ids: id, title: '오답 다시 풀기' } })}
                  />
                </View>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
});
