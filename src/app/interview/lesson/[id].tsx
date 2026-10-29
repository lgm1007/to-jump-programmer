import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { CaseBadge, LessonStatusBadge } from '@/components/lesson-status-badge';
import { Inline, RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CS_CATEGORY_MAP, LESSON_MAP, LESSON_QUESTION_IDS, type CsLesson } from '@/content';
import { AdSlot } from '@/features/ads';
import { categoryLessons, lessonStatus } from '@/features/progress/lessons';
import { useProgress } from '@/features/progress/store';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export default function LessonScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const lesson = LESSON_MAP[id];
  if (!lesson) {
    return (
      <Screen>
        <EmptyState title="레슨을 찾을 수 없어요" />
      </Screen>
    );
  }
  // 이전 · 다음 레슨으로 넘어가면(같은 화면, 다른 id) 읽기 진행률을 처음부터 다시 잰다
  return <LessonContent key={lesson.id} lesson={lesson} fromQuiz={from === 'quiz'} />;
}

function LessonContent({ lesson, fromQuiz }: { lesson: CsLesson; fromQuiz: boolean }) {
  const c = useColors();
  const record = useProgress((s) => s.lessons[lesson.id]);
  const textSize = useProgress((s) => s.settings.lessonTextSize ?? 'md');
  const updateSettings = useProgress((s) => s.updateSettings);
  const startLesson = useProgress((s) => s.startLesson);
  const finishLessonReading = useProgress((s) => s.finishLessonReading);
  const bookmarked = useProgress((s) => !!s.bookmarks[lesson.id]);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const [progress, setProgress] = useState(record?.readAt ? 1 : 0);
  const size = useRef({ view: 0, content: 0 });

  const category = CS_CATEGORY_MAP[lesson.categoryId];
  const siblings = categoryLessons(lesson.categoryId);
  const index = siblings.findIndex((l) => l.id === lesson.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const checkCount = Math.min(3, LESSON_QUESTION_IDS[lesson.id]?.length ?? 0);
  const status = lessonStatus(record);

  useEffect(() => {
    startLesson(lesson.id);
  }, [lesson.id, startLesson]);

  // 스크롤한 만큼 읽기 진행률을 올리고, 끝까지 읽으면 기록한다 (본문이 화면보다 짧으면 바로 끝)
  const measure = (y: number) => {
    const { view, content } = size.current;
    if (!view || !content) return;
    const ratio = content <= view ? 1 : Math.min(1, (y + view) / content);
    setProgress((p) => Math.max(p, ratio));
    if (ratio >= 0.97) finishLessonReading(lesson.id);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => measure(e.nativeEvent.contentOffset.y);

  const startCheck = () => {
    haptic('light');
    router.push({ pathname: '/quiz', params: { mode: 'lesson', id: lesson.id } });
  };

  return (
    <Screen
      scrollProps={{
        onScroll,
        scrollEventThrottle: 100,
        onLayout: (e) => {
          size.current.view = e.nativeEvent.layout.height;
          measure(0);
        },
        onContentSizeChange: (_w, h) => {
          size.current.content = h;
          measure(0);
        },
      }}
      footer={
        <View style={{ flex: 1, gap: spacing.sm }}>
          <ProgressBar value={progress} color={c.cs} height={4} />
          {fromQuiz ? (
            <Button title="퀴즈로 돌아가기" icon="arrow-back" tint={c.cs} onPress={() => router.back()} />
          ) : checkCount > 0 ? (
            <Button
              title={status === 'done' ? `확인 퀴즈 다시 풀기 (${checkCount}문제)` : `확인 퀴즈 풀기 (${checkCount}문제)`}
              icon="flash"
              tint={c.cs}
              variant={progress >= 0.97 || status === 'done' ? 'primary' : 'secondary'}
              onPress={startCheck}
            />
          ) : (
            next && <Button title="다음 레슨" icon="arrow-forward" tint={c.cs} onPress={() => router.replace(`/interview/lesson/${next.id}`)} />
          )}
        </View>
      }>
      <Stack.Screen
        options={{
          title: category?.title ?? 'CS 이론',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  haptic('selection');
                  updateSettings({ lessonTextSize: textSize === 'md' ? 'lg' : 'md' });
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={textSize === 'md' ? '글자 크게' : '글자 작게'}>
                <Text variant={textSize === 'md' ? 'callout' : 'headline'} weight="700">
                  가
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptic('selection');
                  toggleBookmark(lesson.id, 'lesson');
                }}
                hitSlop={10}
                accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}>
                <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? c.warning : c.text} />
              </Pressable>
            </View>
          ),
        }}
      />

      <View style={{ gap: spacing.sm }}>
        <View style={styles.badges}>
          <Badge label={`레슨 ${index + 1}/${siblings.length}`} tone="cs" />
          <DifficultyBadge level={lesson.difficulty} />
          <Badge label={`${lesson.minutes}분`} icon="time-outline" />
          <CaseBadge categoryId={lesson.categoryId} />
          <LessonStatusBadge lessonId={lesson.id} />
        </View>
        <Text variant="title2">{lesson.title}</Text>
        <Inline text={lesson.summary} variant="callout" color={c.textSecondary} />
      </View>

      <RichText text={lesson.body} variant={textSize === 'lg' ? 'body' : 'callout'} />

      <Card style={[styles.keyPoints, { borderLeftColor: c.cs }]}>
        <Text variant="captionStrong" tint={c.cs}>
          핵심 정리
        </Text>
        {lesson.keyPoints.map((point, i) => (
          <View key={i} style={styles.point}>
            <Ionicons name="checkmark-circle" size={18} color={c.cs} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Inline text={point} variant={textSize === 'lg' ? 'body' : 'callout'} />
            </View>
          </View>
        ))}
      </Card>

      {record?.completedAt && (
        <Text variant="caption" color="textTertiary" align="center">
          최근 확인 퀴즈 {record.correct}/{record.total} 정답
        </Text>
      )}

      <AdSlot />

      {(prev || next) && (
        <View style={styles.nav}>
          {prev ? (
            <Card style={styles.navCard} onPress={() => router.replace(`/interview/lesson/${prev.id}`)}>
              <Text variant="small" color="textTertiary">
                ← 이전 레슨
              </Text>
              <Text variant="subhead" weight="600" numberOfLines={2}>
                {prev.title}
              </Text>
            </Card>
          ) : (
            <View style={styles.navCard} />
          )}
          {next ? (
            <Card style={styles.navCard} onPress={() => router.replace(`/interview/lesson/${next.id}`)}>
              <Text variant="small" color="textTertiary" align="right">
                다음 레슨 →
              </Text>
              <Text variant="subhead" weight="600" numberOfLines={2} align="right">
                {next.title}
              </Text>
            </Card>
          ) : (
            <View style={styles.navCard} />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  keyPoints: { gap: spacing.sm, borderLeftWidth: 3 },
  point: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  nav: { flexDirection: 'row', gap: spacing.md },
  navCard: { flex: 1, gap: 4 },
});
