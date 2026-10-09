import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CodeBlock } from '@/components/code-block';
import { Inline, RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Footer } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import {
  ALGO_QUIZ,
  ALGO_TOPIC_MAP,
  CS_CATEGORY_MAP,
  CS_CONTENT,
  QUESTION_MAP,
  QUESTION_SOURCE,
  type QuizQuestion,
} from '@/content';
import { showInterstitialAtBreak } from '@/features/ads';
import { wrongQuestionIds } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { formatDuration, shuffle } from '@/lib/date';
import { plainText } from '@/lib/markdown';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme/tokens';

type Params = { mode?: string; id?: string; ids?: string; title?: string; shuffle?: string };

function resolveQuestions(p: Params): { ids: string[]; title: string } {
  const state = useProgress.getState();
  switch (p.mode) {
    case 'topic': {
      const ids = (ALGO_QUIZ[p.id ?? '']?.questions ?? []).map((q) => q.id);
      return { ids, title: p.title ?? `${ALGO_TOPIC_MAP[p.id ?? '']?.title ?? ''} 퀴즈` };
    }
    case 'cs': {
      const ids = (CS_CONTENT[p.id ?? '']?.quiz ?? []).map((q) => q.id);
      return { ids, title: p.title ?? `${CS_CATEGORY_MAP[p.id ?? '']?.title ?? ''} 퀴즈` };
    }
    case 'wrong': {
      const filter = p.id ? (id: string) => QUESTION_MAP[id]?.categoryId === p.id : undefined;
      return { ids: wrongQuestionIds(state.quiz, filter), title: p.title ?? '오답 다시 풀기' };
    }
    case 'bookmarks':
      return {
        ids: Object.keys(state.bookmarks).filter((id) => QUESTION_MAP[id]),
        title: p.title ?? '북마크한 문제',
      };
    default:
      return { ids: (p.ids ?? '').split(',').filter((id) => QUESTION_MAP[id]), title: p.title ?? '퀴즈' };
  }
}

function categoryLabel(q: QuizQuestion): string {
  return QUESTION_SOURCE[q.id] === 'algo'
    ? `알고리즘 · ${ALGO_TOPIC_MAP[q.categoryId]?.title ?? ''}`
    : (CS_CATEGORY_MAP[q.categoryId]?.title ?? '');
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** 이벤트 핸들러에서만 호출 (렌더 중 호출 금지) */
function elapsedSince(start: number): number {
  return Date.now() - start;
}

export default function QuizScreen() {
  const c = useColors();
  const params = useLocalSearchParams<Params>();
  const initial = useMemo(() => {
    const r = resolveQuestions(params);
    return { ...r, ids: params.shuffle === '1' ? shuffle(r.ids) : r.ids };
    // 세션 시작 시점의 문제 목록을 고정한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [ids, setIds] = useState(initial.ids);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | boolean | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const explanationY = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const recordQuiz = useProgress((s) => s.recordQuiz);
  const bookmarks = useProgress((s) => s.bookmarks);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);

  const q = QUESTION_MAP[ids[index]];
  const answered = answer !== null;
  const isCorrect = answered && q ? answer === q.answer : false;

  const choose = (value: number | boolean) => {
    if (answered || !q) return;
    const correct = value === q.answer;
    setAnswer(value);
    setResults((r) => ({ ...r, [q.id]: correct }));
    recordQuiz(q.id, correct);
    haptic(correct ? 'success' : 'error');
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, explanationY.current - 120), animated: true }), 150);
  };

  const next = () => {
    haptic('light');
    if (index + 1 >= ids.length) {
      setElapsedMs(elapsedSince(startedAt.current));
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setAnswer(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (ids.length === 0 || !q) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]}>
        <TopBar onClose={close} progress={0} label="" />
        <EmptyState icon="checkmark-done" title="풀 문제가 없어요" description="다른 퀴즈를 골라보세요." action={<Button title="돌아가기" onPress={close} />} />
      </SafeAreaView>
    );
  }

  if (finished) {
    const total = ids.length;
    const correct = ids.filter((id) => results[id]).length;
    const wrongIds = ids.filter((id) => !results[id]);
    const pct = total ? correct / total : 0;
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]} edges={['top']}>
        <TopBar onClose={close} progress={1} label={`${total}/${total}`} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.inner}>
            <Card style={styles.resultCard}>
              <ProgressRing
                value={pct}
                size={132}
                stroke={12}
                color={pct >= 0.8 ? c.success : pct >= 0.5 ? c.primary : c.warning}
                label={`${Math.round(pct * 100)}점`}
                sublabel={`${correct} / ${total} 정답`}
              />
              <Text variant="title2" align="center">
                {pct === 1 ? '완벽해요! 🎉' : pct >= 0.8 ? '훌륭해요! 👏' : pct >= 0.5 ? '좋아요, 조금만 더!' : '복습하면 금방 늘어요 💪'}
              </Text>
              <Text variant="callout" color="textTertiary" align="center">
                {initial.title} · {round > 1 ? `${round}회차 · ` : ''}소요 시간 {formatDuration(elapsedMs)}
              </Text>
            </Card>

            {wrongIds.length > 0 && (
              <View style={{ gap: spacing.md }}>
                <Text variant="title3">틀린 문제 {wrongIds.length}개</Text>
                <Text variant="caption" color="textTertiary">
                  오답노트에 자동으로 저장했어요. 다시 맞히면 오답노트에서 빠져요.
                </Text>
                {wrongIds.map((id) => (
                  <WrongItem key={id} question={QUESTION_MAP[id]} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <Footer>
          {wrongIds.length > 0 && (
            <Button
              title="틀린 문제 다시 풀기"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => {
                setIds(wrongIds);
                setIndex(0);
                setAnswer(null);
                setResults({});
                setFinished(false);
                setRound((r) => r + 1);
                startedAt.current = Date.now();
              }}
            />
          )}
          <Button title="완료" style={{ flex: 1 }} onPress={() => showInterstitialAtBreak(close)} />
        </Footer>
      </SafeAreaView>
    );
  }

  const bookmarked = !!bookmarks[q.id];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]} edges={['top']}>
      <TopBar onClose={close} progress={(index + (answered ? 1 : 0)) / ids.length} label={`${index + 1}/${ids.length}`} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <View style={styles.metaRow}>
            <Badge label={categoryLabel(q)} tone={QUESTION_SOURCE[q.id] === 'algo' ? 'algo' : 'cs'} />
            <DifficultyBadge level={q.difficulty} />
            {q.type === 'ox' && <Badge label="O / X" />}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => {
                haptic('selection');
                toggleBookmark(q.id, 'question');
              }}
              hitSlop={10}
              accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}>
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? c.warning : c.textTertiary} />
            </Pressable>
          </View>

          <RichText text={q.prompt} variant="title3" />
          {q.code && <CodeBlock code={q.code.source} language={q.code.language} filename={q.code.filename} />}

          {q.type === 'mcq' ? (
            <View style={{ gap: spacing.sm }}>
              {q.choices.map((choice, i) => {
                const state = !answered
                  ? 'idle'
                  : i === q.answer
                    ? 'correct'
                    : i === answer
                      ? 'wrong'
                      : 'dim';
                return <ChoiceRow key={i} letter={LETTERS[i]} text={choice} state={state} onPress={() => choose(i)} />;
              })}
            </View>
          ) : (
            <View style={styles.oxRow}>
              {[true, false].map((v) => {
                const state = !answered ? 'idle' : v === q.answer ? 'correct' : v === answer ? 'wrong' : 'dim';
                return <OxButton key={String(v)} value={v} state={state} onPress={() => choose(v)} />;
              })}
            </View>
          )}

          {answered && (
            <View onLayout={(e) => (explanationY.current = e.nativeEvent.layout.y)} style={{ gap: spacing.md }}>
              <View style={[styles.feedback, { backgroundColor: isCorrect ? c.successSoft : c.dangerSoft }]}>
                <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={22} color={isCorrect ? c.success : c.danger} />
                <Text variant="bodyStrong" tint={isCorrect ? c.success : c.danger}>
                  {isCorrect
                    ? '정답이에요!'
                    : `아쉬워요. 정답은 ${q.type === 'mcq' ? `${LETTERS[q.answer]}번` : q.answer ? 'O' : 'X'}이에요`}
                </Text>
              </View>
              <Card style={{ gap: spacing.sm }}>
                <Text variant="captionStrong" color="textTertiary">
                  해설
                </Text>
                <RichText text={q.explanation} variant="callout" />
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
      <Footer>
        {answered ? (
          <Button title={index + 1 >= ids.length ? '결과 보기' : '다음 문제'} onPress={next} fullWidth style={{ flex: 1 }} />
        ) : (
          <View style={styles.footerHint}>
            <Text variant="caption" color="textTertiary">
              {q.type === 'mcq' ? '정답이라고 생각하는 선택지를 눌러주세요' : '맞으면 O, 틀리면 X를 눌러주세요'}
            </Text>
          </View>
        )}
      </Footer>
    </SafeAreaView>
  );
}

function TopBar({ onClose, progress, label }: { onClose: () => void; progress: number; label: string }) {
  const c = useColors();
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="닫기">
        <Ionicons name="close" size={26} color={c.text} />
      </Pressable>
      <ProgressBar value={progress} style={{ flex: 1 }} height={8} />
      <Text variant="captionStrong" color="textSecondary" style={{ minWidth: 40, textAlign: 'right' }}>
        {label}
      </Text>
    </View>
  );
}

type ChoiceState = 'idle' | 'correct' | 'wrong' | 'dim';

function ChoiceRow({ letter, text, state, onPress }: { letter: string; text: string; state: ChoiceState; onPress: () => void }) {
  const c = useColors();
  const border = state === 'correct' ? c.success : state === 'wrong' ? c.danger : c.border;
  const bg = state === 'correct' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.surface;
  const circleBg = state === 'correct' ? c.success : state === 'wrong' ? c.danger : c.surfaceAlt;
  return (
    <PressableScale
      onPress={onPress}
      disabled={state !== 'idle'}
      accessibilityRole="button"
      accessibilityLabel={`${letter}. ${plainText(text)}`}
      style={[styles.choice, { borderColor: border, backgroundColor: bg, opacity: state === 'dim' ? 0.55 : 1 }]}>
      <View style={[styles.letter, { backgroundColor: circleBg }]}>
        {state === 'correct' || state === 'wrong' ? (
          <Ionicons name={state === 'correct' ? 'checkmark' : 'close'} size={16} color="#fff" />
        ) : (
          <Text variant="captionStrong" color="textSecondary">
            {letter}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Inline text={text} variant="callout" />
      </View>
    </PressableScale>
  );
}

function OxButton({ value, state, onPress }: { value: boolean; state: ChoiceState; onPress: () => void }) {
  const c = useColors();
  const base = value ? c.primary : c.danger;
  const border = state === 'correct' ? c.success : state === 'wrong' ? c.danger : c.border;
  const bg = state === 'correct' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.surface;
  return (
    <PressableScale
      onPress={onPress}
      disabled={state !== 'idle'}
      accessibilityRole="button"
      accessibilityLabel={value ? 'O, 맞다' : 'X, 틀리다'}
      style={[styles.ox, { borderColor: border, backgroundColor: bg, opacity: state === 'dim' ? 0.5 : 1 }]}>
      <Text style={{ fontSize: 56, lineHeight: 64, fontWeight: '800' }} tint={base}>
        {value ? 'O' : 'X'}
      </Text>
      <Text variant="captionStrong" color="textTertiary">
        {value ? '맞아요' : '틀려요'}
      </Text>
    </PressableScale>
  );
}

function WrongItem({ question }: { question: QuizQuestion }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  if (!question) return null;
  const answerLabel = question.type === 'mcq' ? `${LETTERS[question.answer]}. ${question.choices[question.answer]}` : question.answer ? 'O' : 'X';
  return (
    <Card onPress={() => setOpen((o) => !o)} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <Ionicons name="close-circle" size={18} color={c.danger} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Inline text={question.prompt.split('\n')[0]} variant="callout" numberOfLines={open ? undefined : 2} />
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
      </View>
      {open && (
        <View style={{ gap: spacing.sm, paddingLeft: 26 }}>
          <Inline text={`정답: ${answerLabel}`} variant="captionStrong" color={c.success} />
          <RichText text={question.explanation} variant="caption" />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: spacing.xxxl },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5 },
  letter: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  oxRow: { flexDirection: 'row', gap: spacing.md },
  ox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, borderRadius: radius.lg, borderWidth: 1.5 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  footerHint: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center' },
  resultCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
});
