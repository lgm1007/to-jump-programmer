import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CodeBlock, type LineMark } from '@/components/code-block';
import { DiffView } from '@/components/diff-view';
import { Inline, RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, SectionHeader } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressRing } from '@/components/ui/progress';
import { Footer } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import {
  CHALLENGE_MAP,
  REVIEW_CATEGORY_LABEL,
  REVIEW_CONTENT,
  REVIEW_FRAMEWORK_MAP,
  SEVERITY_LABEL,
  type ReviewChallenge,
  type Severity,
} from '@/content';
import { showInterstitialAtBreak } from '@/features/ads';
import { useProgress } from '@/features/progress/store';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme/tokens';

type Step = 'read' | 'choose' | 'result';

const WRONG_LINE_PENALTY = 0.25;

function grade(ch: ReviewChallenge, lines: Set<number>, picked: Set<number>) {
  const issueLines = new Set(ch.issues.flatMap((i) => i.lines));
  const found = ch.issues.map((i) => i.lines.some((n) => lines.has(n)));
  const foundCount = found.filter(Boolean).length;
  const correctIdx = ch.question.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  const tp = correctIdx.filter((i) => picked.has(i)).length;
  const fp = [...picked].filter((i) => !ch.question.options[i]?.correct).length;
  const optionScore = correctIdx.length ? Math.max(0, (tp - fp) / correctIdx.length) : 0;
  const wrongLines = [...lines].filter((n) => !issueLines.has(n)).length;
  // 문제없는 줄을 고르면 줄당 이슈 1/4개만큼 감점 (아무 줄이나 다 고르는 전략 방지)
  const lineScore = Math.max(0, (foundCount - WRONG_LINE_PENALTY * wrongLines) / ch.issues.length);
  const score = Math.round(50 * lineScore + 50 * optionScore);
  return { issueLines, found, foundCount, tp, fp, correctCount: correctIdx.length, score, wrongLines };
}

const SEVERITY_TONE: Record<Severity, 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger',
  major: 'warning',
  minor: 'neutral',
};

export default function ChallengeScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ch = CHALLENGE_MAP[id];
  const record = useProgress((s) => s.challenges[id]);
  const recordChallenge = useProgress((s) => s.recordChallenge);
  const [step, setStep] = useState<Step>('read');
  const [lines, setLines] = useState<Set<number>>(new Set());
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');
  const [fixView, setFixView] = useState<'improved' | 'diff'>('improved');
  const scrollRef = useRef<ScrollView>(null);

  const result = useMemo(() => (ch ? grade(ch, lines, picked) : null), [ch, lines, picked]);

  if (!ch || !result) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="퀴즈를 찾을 수 없어요" />
      </View>
    );
  }

  const fw = REVIEW_FRAMEWORK_MAP[ch.framework];
  const list = REVIEW_CONTENT[ch.framework].challenges;
  const next = list[list.findIndex((x) => x.id === ch.id) + 1];

  const toggleLine = (n: number) => {
    haptic('selection');
    setLines((prev) => {
      const s = new Set(prev);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return s;
    });
  };

  const toggleOption = (i: number) => {
    haptic('selection');
    setPicked((prev) => {
      const s = new Set(prev);
      if (s.has(i)) s.delete(i);
      else s.add(i);
      return s;
    });
  };

  const goto = (s: Step) => {
    setStep(s);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const submit = () => {
    recordChallenge(ch.id, result.score, note.trim() || undefined);
    haptic(result.score >= 80 ? 'success' : 'light');
    goto('result');
  };

  const retry = () => {
    setLines(new Set());
    setPicked(new Set());
    setFixView('improved');
    goto('read');
  };

  const resultMarks: Record<number, LineMark> = {};
  if (step === 'result') {
    result.issueLines.forEach((n) => (resultMarks[n] = lines.has(n) ? 'hit' : 'miss'));
    lines.forEach((n) => {
      if (!result.issueLines.has(n)) resultMarks[n] = 'wrong';
    });
  }
  const selectedMarks: Record<number, LineMark> = {};
  lines.forEach((n) => (selectedMarks[n] = 'selected'));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: `${fw.title} 리뷰` }} />
      <View style={[styles.stepper, { borderBottomColor: c.border }]}>
        {(['read', 'choose', 'result'] as Step[]).map((s, i) => {
          const order = ['read', 'choose', 'result'].indexOf(step);
          const active = i <= order;
          return (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: active ? c.review : c.border }]}>
                <Text variant="small" tint="#FFFFFF" weight="700">
                  {i + 1}
                </Text>
              </View>
              <Text variant="small" weight={i === order ? '700' : '500'} color={active ? 'text' : 'textTertiary'}>
                {['문제 줄 찾기', '문제점 고르기', '채점 · 개선안'][i]}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.inner}>
          {step === 'read' && (
            <>
              <View style={{ gap: spacing.sm }}>
                <View style={styles.badges}>
                  <DifficultyBadge level={ch.difficulty} />
                  {ch.subFramework && <Badge label={ch.subFramework} />}
                  <Badge label={`숨은 이슈 ${ch.issues.length}개`} tone="review" />
                  {record && <Badge label={`최고 ${record.best}점`} tone="success" />}
                </View>
                <Text variant="title2">{ch.title}</Text>
              </View>
              <Card style={{ gap: spacing.sm }}>
                <Text variant="captionStrong" color="textTertiary">
                  상황
                </Text>
                <RichText text={ch.context} variant="callout" />
              </Card>
              <View style={[styles.instruction, { backgroundColor: c.reviewSoft }]}>
                <Ionicons name="finger-print" size={18} color={c.review} />
                <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
                  문제가 있다고 생각되는 줄을 탭해서 표시하세요. 문제없는 줄을 고르면 감점돼요.
                </Text>
                <Badge label={`${lines.size}줄 선택`} tone={lines.size ? 'warning' : 'neutral'} />
              </View>
              <CodeBlock
                code={ch.code.source}
                language={ch.code.language}
                filename={ch.code.filename}
                onLinePress={toggleLine}
                marks={selectedMarks}
                showLineNumbers
              />
            </>
          )}

          {step === 'choose' && (
            <>
              <Text variant="title3">{ch.question.prompt}</Text>
              <Text variant="caption" color="textTertiary">
                정답은 여러 개일 수 있어요. 코드에 실제로 있는 문제만 고르세요.
              </Text>
              <View style={{ gap: spacing.sm }}>
                {ch.question.options.map((o, i) => {
                  const on = picked.has(i);
                  return (
                    <PressableScale
                      key={i}
                      onPress={() => toggleOption(i)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      style={[styles.option, { borderColor: on ? c.review : c.border, backgroundColor: on ? c.reviewSoft : c.surface }]}>
                      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? c.review : c.textTertiary} />
                      <View style={{ flex: 1 }}>
                        <Inline text={o.text} variant="callout" />
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <Text variant="subhead" weight="700">
                  나의 리뷰 코멘트 (선택)
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  multiline
                  placeholder="예) 반복문 안에서 연관 엔티티를 조회해 N+1 이 발생할 수 있습니다. fetch join 을 고려해주세요."
                  placeholderTextColor={c.textTertiary}
                  style={[styles.note, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text variant="small" color="textTertiary">
                  실제 코드 리뷰 과제처럼 근거와 대안을 함께 적어보세요. 결과 화면에서 모범 리뷰와 비교할 수 있어요.
                </Text>
              </View>
            </>
          )}

          {step === 'result' && (
            <>
              <Card style={styles.scoreCard}>
                <ProgressRing
                  value={result.score / 100}
                  size={110}
                  stroke={11}
                  color={result.score >= 80 ? c.success : result.score >= 50 ? c.review : c.warning}
                  label={`${result.score}점`}
                />
                <View style={{ flex: 1, gap: spacing.sm }}>
                  <Text variant="headline">
                    {result.score >= 90 ? '시니어급 리뷰예요! 👏' : result.score >= 70 ? '날카로운 리뷰예요' : result.score >= 40 ? '좋은 출발이에요' : '개선안을 꼭 읽어보세요'}
                  </Text>
                  <Stat label="찾은 이슈" value={`${result.foundCount} / ${ch.issues.length}`} />
                  <Stat label="문제점 선택" value={`${result.tp} / ${result.correctCount}${result.fp ? ` · 오답 ${result.fp}` : ''}`} />
                  {result.wrongLines > 0 && <Stat label="문제없는 줄 선택 (감점)" value={`${result.wrongLines}줄`} />}
                </View>
              </Card>

              <CodeBlock
                code={ch.code.source}
                language={ch.code.language}
                filename={ch.code.filename}
                marks={resultMarks}
                showLineNumbers
              />
              <View style={styles.legend}>
                <Legend color={c.success} label="찾은 줄" />
                <Legend color={c.danger} label="놓친 줄" />
                <Legend color={c.warning} label="문제없는 줄" />
              </View>

              <SectionHeader title="정답 이슈" subtitle="모범 리뷰 코멘트" />
              {ch.issues.map((issue, i) => (
                <Card key={i} style={{ gap: spacing.sm }}>
                  <View style={styles.badges}>
                    <Badge label={SEVERITY_LABEL[issue.severity]} tone={SEVERITY_TONE[issue.severity]} />
                    <Badge label={REVIEW_CATEGORY_LABEL[issue.category]} tone="review" />
                    <Badge label={lineLabel(issue.lines)} />
                    <View style={{ flex: 1 }} />
                    <Badge
                      label={result.found[i] ? '찾음' : '놓침'}
                      tone={result.found[i] ? 'success' : 'danger'}
                      icon={result.found[i] ? 'checkmark' : 'close'}
                    />
                  </View>
                  <Text variant="bodyStrong">{issue.title}</Text>
                  <RichText text={issue.description} variant="callout" />
                  <View style={[styles.suggestion, { backgroundColor: c.surfaceAlt }]}>
                    <Text variant="captionStrong" tint={c.review}>
                      제안
                    </Text>
                    <RichText text={issue.suggestion} variant="callout" />
                  </View>
                </Card>
              ))}

              <SectionHeader title="문제점 선택 결과" />
              <Card style={{ gap: spacing.md }}>
                {ch.question.options.map((o, i) => {
                  const on = picked.has(i);
                  const icon = o.correct ? (on ? 'checkmark-circle' : 'alert-circle') : on ? 'close-circle' : 'ellipse-outline';
                  const color = o.correct ? (on ? c.success : c.warning) : on ? c.danger : c.textTertiary;
                  const tag = o.correct ? (on ? '정답' : '놓친 정답') : on ? '오답 선택' : '';
                  return (
                    <View key={i} style={styles.optionResult}>
                      <Ionicons name={icon} size={20} color={color} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Inline text={o.text} variant="callout" color={o.correct || on ? c.text : c.textTertiary} />
                        {!!tag && (
                          <Text variant="small" tint={color}>
                            {tag}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Card>

              <SectionHeader title="베스트 개선안" />
              <SegmentedControl
                value={fixView}
                onChange={setFixView}
                options={[
                  { value: 'improved', label: '개선된 코드' },
                  { value: 'diff', label: '변경점' },
                ]}
              />
              {fixView === 'improved' ? (
                <CodeBlock
                  code={ch.improved.source}
                  language={ch.improved.language}
                  filename={ch.improved.filename}
                  label="개선 후"
                  labelColor={c.success}
                />
              ) : (
                <DiffView before={ch.code.source} after={ch.improved.source} language={ch.improved.language} />
              )}

              <Card style={{ gap: spacing.sm }}>
                <Text variant="captionStrong" color="textTertiary">
                  총평
                </Text>
                <RichText text={ch.summary} variant="callout" />
              </Card>

              {!!note.trim() && (
                <Card style={{ gap: spacing.sm }} tint={c.surfaceAlt}>
                  <Text variant="captionStrong" color="textTertiary">
                    내가 작성한 리뷰
                  </Text>
                  <Text variant="callout">{note.trim()}</Text>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Footer>
        {step === 'read' && (
          <Button
            title={lines.size ? '다음: 문제점 고르기' : '줄을 하나 이상 선택하세요'}
            iconRight="arrow-forward"
            disabled={!lines.size}
            tint={c.review}
            style={{ flex: 1 }}
            onPress={() => goto('choose')}
          />
        )}
        {step === 'choose' && (
          <>
            <Button title="이전" variant="secondary" onPress={() => goto('read')} />
            <Button title="채점하기" icon="checkmark-done" disabled={!picked.size} tint={c.review} style={{ flex: 1 }} onPress={submit} />
          </>
        )}
        {step === 'result' && (
          <>
            <Button title="다시 풀기" variant="secondary" icon="refresh" onPress={retry} />
            <Button
              title={next ? '다음 퀴즈' : '목록으로'}
              iconRight={next ? 'arrow-forward' : undefined}
              tint={c.review}
              style={{ flex: 1 }}
              onPress={() =>
                showInterstitialAtBreak(() => (next ? router.replace(`/review/challenge/${next.id}`) : router.back()))
              }
            />
          </>
        )}
      </Footer>
    </View>
  );
}

function lineLabel(lines: number[]): string {
  const sorted = [...lines].sort((a, b) => a - b);
  if (sorted.length === 1) return `L${sorted[0]}`;
  const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
  return contiguous ? `L${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.map((n) => `L${n}`).join(', ');
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="caption" color="textTertiary">
        {label}
      </Text>
      <Text variant="captionStrong">{value}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text variant="small" color="textTertiary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: spacing.xxxl },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, padding: spacing.xl, gap: spacing.lg },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  instruction: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5 },
  note: { minHeight: 110, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 15, lineHeight: 22 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  legend: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' },
  suggestion: { gap: 6, padding: spacing.md, borderRadius: radius.md },
  optionResult: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
