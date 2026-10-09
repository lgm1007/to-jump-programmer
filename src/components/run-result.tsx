import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import type { Param } from '@/content';
import { formatValue } from '@/features/runner/core/compare';
import type { CaseResult, RunResult } from '@/features/runner/core/types';
import { summarize } from '@/features/runner/runner';
import { useColors } from '@/theme/theme-provider';
import { fonts, radius, spacing } from '@/theme/tokens';

/** 웹에서 출력/에러의 공백과 줄바꿈을 그대로 보여준다 */
const MONO_PRE = (Platform.OS === 'web' ? { whiteSpace: 'pre-wrap' } : null) as object | null;

export interface RunResultViewProps {
  running: boolean;
  status: string;
  progress?: { done: number; total: number };
  kind?: 'run' | 'submit';
  result?: RunResult | null;
  params: Param[];
  onOpenSettings?: () => void;
  onChangeLanguage?: () => void;
  onShowSolution?: () => void;
  onNextProblem?: () => void;
}

export function RunResultView({
  running,
  status,
  progress,
  kind,
  result,
  params,
  onOpenSettings,
  onChangeLanguage,
  onShowSolution,
  onNextProblem,
}: RunResultViewProps) {
  const c = useColors();

  if (running) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text variant="bodyStrong">{kind === 'submit' ? '제출한 코드를 채점하는 중…' : '예제로 실행하는 중…'}</Text>
        {!!status && (
          <Text variant="caption" color="textTertiary" align="center">
            {status}
          </Text>
        )}
        {progress && progress.total > 0 && (
          <Text variant="captionStrong" color="textSecondary">
            {progress.done} / {progress.total}
          </Text>
        )}
      </View>
    );
  }

  if (!result) {
    return (
      <EmptyState
        icon="terminal-outline"
        title="아직 실행 결과가 없어요"
        description={'[실행]은 입출력 예로만 확인하고,\n[제출]은 숨겨진 테스트까지 채점해요.'}
      />
    );
  }

  if (result.status === 'unavailable') {
    return (
      <View style={{ gap: spacing.md }}>
        <Card style={{ gap: spacing.md }}>
          <View style={styles.row}>
            <Ionicons name="cloud-offline-outline" size={22} color={c.warning} />
            <Text variant="headline">원격 실행 서버가 필요해요</Text>
          </View>
          <Text variant="callout" color="textSecondary">
            {result.message}
          </Text>
          <Text variant="caption" color="textTertiary">
            Python · JavaScript 는 기기 안에서 바로 실행돼요. Java · C++ 는 직접 운영하는 Piston 서버(무료 오픈소스)를 연결하면 채점할 수 있어요.
          </Text>
        </Card>
        <View style={styles.actions}>
          {onOpenSettings && <Button title="서버 설정" variant="secondary" size="md" style={{ flex: 1 }} onPress={onOpenSettings} />}
          {onChangeLanguage && <Button title="다른 언어로 풀기" size="md" style={{ flex: 1 }} onPress={onChangeLanguage} />}
        </View>
        {onShowSolution && <Button title="모범 답안과 비교하기" variant="ghost" size="md" onPress={onShowSolution} />}
      </View>
    );
  }

  if (result.status === 'compile-error' || result.status === 'internal-error') {
    const compile = result.status === 'compile-error';
    return (
      <Card style={{ gap: spacing.md }} tint={compile ? c.dangerSoft : c.warningSoft}>
        <View style={styles.row}>
          <Ionicons name={compile ? 'bug-outline' : 'alert-circle-outline'} size={22} color={compile ? c.danger : c.warning} />
          <Text variant="headline" tint={compile ? c.danger : c.warning}>
            {compile ? '컴파일 · 문법 오류' : '실행할 수 없어요'}
          </Text>
        </View>
        <View style={[styles.mono, { backgroundColor: c.surface }]}>
          <Text variant="caption" style={[{ fontFamily: fonts.mono }, MONO_PRE]} selectable>
            {result.message}
          </Text>
        </View>
      </Card>
    );
  }

  const { passed, total, allPassed } = summarize(result);
  const submitted = kind === 'submit';
  return (
    <View style={{ gap: spacing.md }}>
      <Card style={{ gap: spacing.md }} tint={allPassed ? c.successSoft : c.surface}>
        <View style={styles.row}>
          <Ionicons
            name={allPassed ? (submitted ? 'trophy' : 'checkmark-circle') : 'close-circle'}
            size={26}
            color={allPassed ? c.success : c.danger}
          />
          <View style={{ flex: 1 }}>
            <Text variant="title3" tint={allPassed ? c.success : c.text}>
              {allPassed ? (submitted ? '정답입니다! 🎉' : '예제를 모두 통과했어요') : submitted ? '틀린 테스트가 있어요' : '예제를 통과하지 못했어요'}
            </Text>
            <Text variant="caption" color="textSecondary">
              {passed} / {total} 통과 · {result.elapsedMs < 1000 ? `${Math.max(1, Math.round(result.elapsedMs))}ms` : `${(result.elapsedMs / 1000).toFixed(1)}초`}
              {!submitted && allPassed ? ' · 이제 [제출]로 숨겨진 테스트까지 확인해보세요' : ''}
            </Text>
          </View>
        </View>
        {submitted && allPassed && (
          <View style={styles.actions}>
            {onShowSolution && <Button title="해설 보기" variant="secondary" size="md" style={{ flex: 1 }} onPress={onShowSolution} />}
            {onNextProblem && <Button title="다음 문제" size="md" style={{ flex: 1 }} onPress={onNextProblem} iconRight="arrow-forward" />}
          </View>
        )}
      </Card>
      {result.cases.map((cr) => (
        <CaseRow key={cr.index} result={cr} params={params} visibleCount={result.cases.filter((x) => !x.hidden).length} />
      ))}
    </View>
  );
}

const STATUS_META: Record<CaseResult['status'], { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'success' | 'danger' | 'warning' | 'textTertiary' }> = {
  pass: { label: '통과', icon: 'checkmark-circle', tone: 'success' },
  fail: { label: '실패', icon: 'close-circle', tone: 'danger' },
  error: { label: '런타임 에러', icon: 'warning', tone: 'danger' },
  timeout: { label: '시간 초과', icon: 'time', tone: 'warning' },
  skipped: { label: '건너뜀', icon: 'remove-circle', tone: 'textTertiary' },
};

function CaseRow({ result, params, visibleCount }: { result: CaseResult; params: Param[]; visibleCount: number }) {
  const c = useColors();
  const [open, setOpen] = useState(result.status !== 'pass' && result.status !== 'skipped');
  const meta = STATUS_META[result.status];
  const color = meta.tone === 'textTertiary' ? c.textTertiary : c[meta.tone];
  const label = result.hidden ? `테스트 ${result.index - visibleCount + 1}` : `예제 ${result.index + 1}`;
  return (
    <Card padded={false}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.caseHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Ionicons name={meta.icon} size={20} color={color} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {label}
          {result.hidden ? (
            <Text variant="caption" color="textTertiary">
              {'  '}숨김
            </Text>
          ) : null}
        </Text>
        <Text variant="captionStrong" tint={color}>
          {meta.label}
        </Text>
        {result.timeMs !== undefined && (
          <Text variant="small" color="textTertiary">
            {result.timeMs < 1 ? '<1' : Math.round(result.timeMs)}ms
          </Text>
        )}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.textTertiary} />
      </Pressable>
      {open && (
        <View style={[styles.caseBody, { borderTopColor: c.border }]}>
          {params.map((p, j) => (
            <KV key={p.name} k={p.name} v={formatValue(result.input[j], 1200)} />
          ))}
          <KV k="기댓값" v={formatValue(result.expected, 1200)} color={c.success} />
          {result.actual !== undefined && <KV k="실행 결과" v={formatValue(result.actual, 1200)} color={result.status === 'pass' ? c.success : c.danger} />}
          {!!result.error && <KV k="오류" v={result.error} color={c.danger} />}
          {!!result.stdout && <KV k="출력" v={result.stdout.slice(0, 4000)} />}
        </View>
      )}
    </Card>
  );
}

function KV({ k, v, color }: { k: string; v: string; color?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 3 }}>
      <Text variant="small" color="textTertiary">
        {k}
      </Text>
      <View style={[styles.mono, { backgroundColor: c.codeBg }]}>
        <Text variant="caption" style={[{ fontFamily: fonts.mono }, MONO_PRE]} tint={color ?? c.codeText} selectable>
          {v}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: 60, paddingHorizontal: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  mono: { padding: spacing.md, borderRadius: radius.sm },
  caseHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  caseBody: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
