import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider, EmptyState, IconBadge, SectionHeader } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CS_CATEGORY_MAP, CS_CONTENT } from '@/content';
import { quizSetStats, wrongQuestionIds } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

const RATING_META = {
  good: { icon: 'checkmark-circle', tone: 'success', label: '말할 수 있어요' },
  hard: { icon: 'help-circle', tone: 'warning', label: '애매해요' },
  again: { icon: 'refresh-circle', tone: 'danger', label: '다시 볼래요' },
} as const;

export default function CategoryScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = CS_CATEGORY_MAP[id];
  const content = CS_CONTENT[id];
  const quiz = useProgress((s) => s.quiz);
  const cardRecords = useProgress((s) => s.cards);

  if (!category || !content) {
    return (
      <Screen>
        <EmptyState title="카테고리를 찾을 수 없어요" />
      </Screen>
    );
  }

  const qIds = content.quiz.map((q) => q.id);
  const stats = quizSetStats(qIds, quiz);
  const wrong = wrongQuestionIds(quiz, (qid) => qIds.includes(qid));
  const seenCards = content.cards.filter((card) => cardRecords[card.id]).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: category.title }} />
      <View style={styles.head}>
        <IconBadge name={category.icon} color={c.cs} background={c.csSoft} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title2">{category.title}</Text>
          <Text variant="caption" color="textTertiary">
            {category.description}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Card
          style={styles.action}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'cs', id } })}
          accessibilityLabel="개념 퀴즈 풀기">
          <IconBadge name="flash" color={c.cs} background={c.csSoft} size={36} />
          <Text variant="bodyStrong">개념 퀴즈</Text>
          <Text variant="small" color="textTertiary">
            {stats.attempted}/{stats.total} 풀이 · 정답률 {Math.round(stats.accuracy * 100)}%
          </Text>
          <ProgressBar value={stats.progress} color={c.cs} height={5} />
        </Card>
        <Card
          style={styles.action}
          onPress={() => router.push({ pathname: '/cards', params: { category: id } })}
          accessibilityLabel="면접 질문 카드 연습">
          <IconBadge name="chatbubbles" color={c.cs} background={c.csSoft} size={36} />
          <Text variant="bodyStrong">면접 질문 카드</Text>
          <Text variant="small" color="textTertiary">
            {seenCards}/{content.cards.length} 연습 완료
          </Text>
          <ProgressBar value={content.cards.length ? seenCards / content.cards.length : 0} color={c.cs} height={5} />
        </Card>
      </View>

      {wrong.length > 0 && (
        <Card
          tint={c.dangerSoft}
          style={styles.wrong}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'wrong', id, title: `${category.title} 오답` } })}>
          <Ionicons name="refresh-circle" size={24} color={c.danger} />
          <Text variant="subhead" weight="600" style={{ flex: 1 }}>
            틀린 문제 {wrong.length}개 다시 풀기
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        </Card>
      )}

      <SectionHeader title="면접 질문 목록" subtitle="탭하면 해당 질문부터 연습해요" />
      {content.cards.length === 0 ? (
        <EmptyState icon="construct-outline" title="질문을 준비하고 있어요" />
      ) : (
        <Card padded={false}>
          {content.cards.map((card, i) => {
            const rec = cardRecords[card.id];
            const meta = rec ? RATING_META[rec.rating] : null;
            return (
              <View key={card.id}>
                {i > 0 && <Divider inset={spacing.lg} />}
                <Card
                  tint="transparent"
                  style={styles.row}
                  onPress={() => router.push({ pathname: '/cards', params: { category: id, start: String(i) } })}>
                  <Text variant="captionStrong" color="textTertiary" style={{ width: 24 }}>
                    Q{i + 1}
                  </Text>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text variant="callout" weight="600">
                      {card.question}
                    </Text>
                    <View style={styles.badges}>
                      <DifficultyBadge level={card.difficulty} />
                      {meta && <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />}
                    </View>
                  </View>
                </Card>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1, gap: 8 },
  wrong: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: 0, borderWidth: 0, shadowOpacity: 0 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
});
