import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CaseBadge, LessonStatusBadge } from '@/components/lesson-status-badge';
import { Inline } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider, EmptyState, IconBadge, SectionHeader } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { CS_CATEGORY_MAP, CS_CONTENT } from '@/content';
import { AdSlot } from '@/features/ads';
import { lessonStatus } from '@/features/progress/lessons';
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
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const category = CS_CATEGORY_MAP[id];
  const content = CS_CONTENT[id];
  const quiz = useProgress((s) => s.quiz);
  const cardRecords = useProgress((s) => s.cards);
  const lessonRecords = useProgress((s) => s.lessons);
  const lessons = content?.lessons ?? [];
  // 이론이 있으면 이론부터 (면접 CS 탭의 퀴즈 · 카드 보기에서 들어오면 퀴즈 · 카드부터)
  const [tab, setTab] = useState<'lessons' | 'practice'>(
    initialTab === 'practice' || !lessons.length ? 'practice' : 'lessons',
  );

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
  const doneLessons = lessons.filter((l) => lessonStatus(lessonRecords[l.id]) === 'done').length;
  const reading = lessons.find((l) => lessonStatus(lessonRecords[l.id]) === 'reading');
  const nextLesson = reading ?? lessons.find((l) => lessonStatus(lessonRecords[l.id]) !== 'done');

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

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'lessons', label: `이론 학습 ${lessons.length}` },
          { value: 'practice', label: '퀴즈 · 카드' },
        ]}
      />

      {tab === 'lessons' ? (
        lessons.length === 0 ? (
          <EmptyState icon="construct-outline" title="이론을 준비하고 있어요" description="퀴즈 · 카드로 먼저 연습해보세요." />
        ) : (
          <>
            <Card style={styles.lessonSummary}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text variant="caption" color="textTertiary">
                  이론 학습 완료
                </Text>
                <Text variant="title3">
                  {doneLessons}/{lessons.length}
                </Text>
                <ProgressBar value={doneLessons / lessons.length} color={c.cs} height={5} />
              </View>
              {nextLesson && (
                <Card
                  tint={c.csSoft}
                  style={styles.continue}
                  onPress={() => router.push(`/interview/lesson/${nextLesson.id}`)}
                  accessibilityLabel={reading ? '읽던 레슨 이어 읽기' : '다음 레슨 읽기'}>
                  <Text variant="small" tint={c.cs} weight="700">
                    {reading ? '이어 읽기' : doneLessons ? '다음 레슨' : '첫 레슨부터'}
                  </Text>
                  <Text variant="caption" numberOfLines={2}>
                    {nextLesson.title}
                  </Text>
                </Card>
              )}
            </Card>
            <Card padded={false}>
              {lessons.map((lesson, i) => (
                <View key={lesson.id}>
                  {i > 0 && <Divider inset={spacing.lg} />}
                  <Card tint="transparent" style={styles.row} onPress={() => router.push(`/interview/lesson/${lesson.id}`)}>
                    <Text variant="captionStrong" color="textTertiary" style={{ width: 24 }}>
                      {i + 1}
                    </Text>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text variant="callout" weight="600">
                        {lesson.title}
                      </Text>
                      <Inline text={lesson.summary} variant="caption" color={c.textTertiary} numberOfLines={2} />
                      <View style={styles.badges}>
                        <CaseBadge categoryId={lesson.categoryId} />
                        <LessonStatusBadge lessonId={lesson.id} />
                        <DifficultyBadge level={lesson.difficulty} />
                        <Badge label={`${lesson.minutes}분`} icon="time-outline" />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.textTertiary} style={{ alignSelf: 'center' }} />
                  </Card>
                </View>
              ))}
            </Card>
          </>
        )
      ) : (
        renderPractice()
      )}
      <AdSlot />
    </Screen>
  );

  // 퀴즈 · 카드 보기 (이전 화면 그대로)
  function renderPractice() {
    return (
      <>
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
      </>
    );
  }
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1, gap: 8 },
  wrong: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: 0, borderWidth: 0, shadowOpacity: 0 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  lessonSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  continue: { flex: 1.2, gap: 4, paddingVertical: spacing.md },
});
