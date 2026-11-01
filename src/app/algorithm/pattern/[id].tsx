import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CodeBlock, type LineMark } from '@/components/code-block';
import { ReviewLanguageToggle } from '@/components/review-language-toggle';
import { Inline, RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, EmptyState, SectionHeader } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import {
  ALGO_PATTERN_MAP,
  ALGO_PATTERNS,
  ALGO_QUIZ,
  ALGO_TOPIC_MAP,
  QUESTION_MAP,
  type AlgoPattern,
} from '@/content';
import { AdSlot } from '@/features/ads';
import { solveLanguagesFor } from '@/features/progress/course';
import { useProgress } from '@/features/progress/store';
import { formatValue } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { LANGUAGE_LABEL } from '@/lib/highlight';
import { useColors } from '@/theme/theme-provider';
import { fonts, spacing } from '@/theme/tokens';

export default function AlgoPatternScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pattern = ALGO_PATTERN_MAP[id];
  if (!pattern) {
    return (
      <Screen>
        <EmptyState title="콘텐츠를 찾을 수 없어요" />
      </Screen>
    );
  }
  // 다음 유형으로 넘어가면(같은 화면, 다른 id) 고른 구현 · 해설을 처음부터 다시 보여준다
  return <PatternContent key={pattern.id} pattern={pattern} />;
}

function PatternContent({ pattern }: { pattern: AlgoPattern }) {
  const c = useColors();
  const language = useProgress((s) => s.profile.language);
  const track = useProgress((s) => s.profile.track);
  const updateProfile = useProgress((s) => s.updateProfile);
  const read = useProgress((s) => !!s.algoPatterns[pattern.id]);
  const markRead = useProgress((s) => s.markAlgoPatternRead);
  const bookmarked = useProgress((s) => !!s.bookmarks[pattern.id]);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const [implIndex, setImplIndex] = useState(0);
  const [pointIndex, setPointIndex] = useState(0);

  const topic = ALGO_TOPIC_MAP[pattern.topicId];
  const siblings = ALGO_PATTERNS[pattern.topicId] ?? [];
  const next = siblings[siblings.findIndex((p) => p.id === pattern.id) + 1];
  const impl = pattern.implementations[implIndex];
  const point = impl.keyPoints[pointIndex];
  const pointLines = point?.lines[language] ?? [];
  const marks = Object.fromEntries(pointLines.map((n) => [n, 'selected' as LineMark]));
  // 관련 퀴즈가 지정되지 않았으면 토픽의 개념 퀴즈로 연결한다
  const quizIds = (pattern.quizIds ?? []).filter((qid) => QUESTION_MAP[qid]);
  const topicQuizCount = ALGO_QUIZ[pattern.topicId]?.questions.length ?? 0;

  const selectImpl = (i: number) => {
    setImplIndex(i);
    setPointIndex(0);
  };
  // 코드 줄을 누르면 그 줄을 설명하는 핵심 해설로 이동한다
  const selectLine = (line: number) => {
    const i = impl.keyPoints.findIndex((k) => k.lines[language]?.includes(line));
    if (i >= 0 && i !== pointIndex) {
      haptic('selection');
      setPointIndex(i);
    }
  };
  const complete = () => {
    markRead(pattern.id);
    haptic('success');
    if (next) router.replace(`/algorithm/pattern/${next.id}`);
    else router.back();
  };

  return (
    <Screen
      footer={
        <Button
          title={next ? (read ? '다음 유형' : '학습 완료 · 다음 유형') : read ? '토픽으로' : '학습 완료'}
          icon={read ? 'arrow-forward' : 'checkmark'}
          tint={c.algo}
          style={{ flex: 1 }}
          href={next ? `/algorithm/pattern/${next.id}` : undefined}
          onPress={complete}
        />
      }>
      <Stack.Screen
        options={{
          title: topic?.title ?? '알고리즘',
          headerRight: () => (
            <Pressable
              onPress={() => {
                haptic('selection');
                toggleBookmark(pattern.id, 'algoPattern');
              }}
              hitSlop={10}
              accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}>
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? c.warning : c.text} />
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: spacing.sm }}>
        <View style={styles.badges}>
          <Badge label={`유형 ${pattern.order}`} tone="algo" />
          <DifficultyBadge level={pattern.difficulty} />
          {read && <Badge label="학습 완료" tone="success" icon="checkmark" />}
        </View>
        <Text variant="title2" heading={1}>
          {pattern.title}
        </Text>
        <Text variant="callout" color="textSecondary">
          {pattern.summary}
        </Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Text variant="captionStrong" tint={c.algo}>
          이런 문제에서 써요
        </Text>
        {pattern.whenToUse.map((line, i) => (
          <View key={i} style={styles.bullet}>
            <Ionicons name="search" size={16} color={c.algo} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Inline text={line} variant="callout" />
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title="접근 방법" />
      <Card>
        <RichText text={pattern.approach} variant="callout" />
      </Card>

      <SectionHeader title="예제 문제" subtitle="아래 구현 예제가 모두 이 문제를 풉니다" />
      <Card style={{ gap: spacing.md }}>
        <RichText text={pattern.example.description} variant="callout" />
        {pattern.example.examples.map((ex, i) => (
          <View key={i} style={[styles.example, { backgroundColor: c.surfaceAlt }]}>
            <Text variant="small" color="textTertiary" weight="700">
              입출력 예 {i + 1}
            </Text>
            {pattern.example.signature.params.map((p, j) => (
              <ValueRow key={p.name} label={p.name} value={formatValue(ex.input[j], 300)} />
            ))}
            <ValueRow label="result" value={formatValue(ex.output, 300)} highlight />
          </View>
        ))}
      </Card>

      <SectionHeader
        title="구현 예제"
        subtitle={pattern.implementations.length > 1 ? `${pattern.implementations.length}가지 방법을 비교해 보세요` : undefined}
      />
      <ReviewLanguageToggle
        languages={solveLanguagesFor(track)}
        value={language}
        onChange={(l) => updateProfile({ language: l })}
        tint={c.algo}
      />
      {pattern.implementations.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {pattern.implementations.map((im, i) => (
            <Chip key={i} label={`${i + 1}. ${im.title}`} selected={implIndex === i} onPress={() => selectImpl(i)} tint={c.algo} />
          ))}
        </ScrollView>
      )}

      <Card style={{ gap: spacing.sm }}>
        <Text variant="headline">{impl.title}</Text>
        <Inline text={impl.summary} variant="callout" color={c.textSecondary} />
        <View style={styles.badges}>
          <Badge label={`시간 ${impl.complexity.time}`} />
          <Badge label={`공간 ${impl.complexity.space}`} />
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="captionStrong" color="textTertiary">
          핵심 해설 · 번호를 누르거나 코드 줄을 눌러 이동해요
        </Text>
        <View style={styles.points}>
          {impl.keyPoints.map((k, i) => (
            <Chip key={i} label={`${i + 1} ${k.title}`} selected={pointIndex === i} onPress={() => setPointIndex(i)} tint={c.warning} />
          ))}
        </View>
        {point && (
          <Card style={[styles.point, { borderLeftColor: c.warning }]}>
            <View style={styles.pointHead}>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {pointIndex + 1}. {point.title}
              </Text>
              {pointLines.length > 0 && (
                <Text variant="small" color="textTertiary">
                  {LANGUAGE_LABEL[language]} {lineRange(pointLines)}줄
                </Text>
              )}
            </View>
            <RichText text={point.explanation} variant="callout" />
            <View style={styles.pointNav}>
              <Button
                title="이전"
                icon="chevron-back"
                size="sm"
                variant="ghost"
                disabled={pointIndex === 0}
                onPress={() => setPointIndex(pointIndex - 1)}
              />
              <Button
                title="다음"
                icon="chevron-forward"
                size="sm"
                variant="ghost"
                disabled={pointIndex >= impl.keyPoints.length - 1}
                onPress={() => setPointIndex(pointIndex + 1)}
              />
            </View>
          </Card>
        )}
      </View>

      <CodeBlock code={impl.code[language]} language={language} marks={marks} onLinePress={selectLine} showLineNumbers />

      <AdSlot />

      {!!pattern.pitfalls?.length && (
        <>
          <SectionHeader title="자주 하는 실수" />
          <Card style={{ gap: spacing.md }}>
            {pattern.pitfalls.map((line, i) => (
              <View key={i} style={styles.bullet}>
                <Ionicons name="alert-circle-outline" size={18} color={c.danger} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Inline text={line} variant="callout" />
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {(quizIds.length > 0 || topicQuizCount > 0) && (
        <Card
          onPress={() =>
            router.push(
              quizIds.length
                ? { pathname: '/quiz', params: { mode: 'ids', ids: quizIds.join(','), title: `${pattern.title} 퀴즈` } }
                : { pathname: '/quiz', params: { mode: 'topic', id: pattern.topicId } },
            )
          }
          style={styles.quiz}>
          <Ionicons name="flash" size={22} color={c.algo} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {quizIds.length ? `관련 개념 퀴즈 ${quizIds.length}문제` : `${topic?.title ?? ''} 개념 퀴즈 ${topicQuizCount}문제`}
            </Text>
            <Text variant="caption" color="textTertiary">
              이해했는지 퀴즈로 확인해 보세요
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        </Card>
      )}
    </Screen>
  );
}

/** [3, 4, 5, 9] → "3-5, 9" */
function lineRange(lines: number[]): string {
  const sorted = [...lines].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j;
  }
  return parts.join(', ');
}

function ValueRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.valueRow}>
      <Text variant="small" style={{ fontFamily: fonts.mono, width: 76 }} tint={highlight ? c.algo : c.textTertiary} numberOfLines={1}>
        {label}
      </Text>
      <Text variant="caption" style={{ fontFamily: fonts.mono, flex: 1 }} tint={highlight ? c.algo : c.text} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  bullet: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  example: { gap: 6, padding: spacing.md, borderRadius: 10 },
  valueRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  chips: { flexDirection: 'row', gap: 8 },
  points: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  point: { gap: spacing.sm, borderLeftWidth: 3 },
  pointHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pointNav: { flexDirection: 'row', justifyContent: 'space-between' },
  quiz: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
