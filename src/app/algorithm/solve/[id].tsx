import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProblemStatement } from '@/components/problem-statement';
import { RunResultView } from '@/components/run-result';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { ALL_PROBLEMS, PROBLEM_MAP, type SolveLanguage } from '@/content';
import { showInterstitialAtBreak } from '@/features/ads';
import { CodeEditor } from '@/features/editor/code-editor';
import { KeyboardToolbar } from '@/features/editor/keyboard-toolbar';
import type { CodeEditorHandle } from '@/features/editor/types';
import { draftKey, useDrafts, useProgress } from '@/features/progress/store';
import { SOLVE_LANGUAGE_MAP, SOLVE_LANGUAGES, starterCode } from '@/features/runner/core/languages';
import type { RunResult } from '@/features/runner/core/types';
import { runSolution, summarize } from '@/features/runner/runner';
import { sandbox } from '@/features/runner/sandbox/client';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { useKeyboardHeight } from '@/lib/use-keyboard';
import { useTheme } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme/tokens';

type Panel = 'problem' | 'code' | 'result';

/** 케이스당 제한 시간 (기기 내 Python 은 WebAssembly 라 여유를 둔다) */
const TIME_LIMIT_MS: Record<SolveLanguage, number> = {
  python: 8000,
  javascript: 4000,
  java: 5000,
  kotlin: 5000,
  cpp: 4000,
};

export default function SolveScreen() {
  const { colors: c, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const problem = PROBLEM_MAP[id];

  const profileLanguage = useProgress((s) => s.profile.language);
  const lastLanguage = useDrafts((s) => s.lastLanguage[id]) ?? useProgress.getState().problems[id]?.language;
  const settings = useProgress((s) => s.settings);
  const recordSubmission = useProgress((s) => s.recordSubmission);
  const setDraft = useDrafts((s) => s.setDraft);
  const clearDraft = useDrafts((s) => s.clearDraft);
  const setLastLanguage = useDrafts((s) => s.setLastLanguage);

  const [language, setLanguage] = useState<SolveLanguage>(lastLanguage ?? profileLanguage);
  const [panel, setPanel] = useState<Panel>('code');
  const [running, setRunning] = useState<null | 'run' | 'submit'>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [result, setResult] = useState<{ kind: 'run' | 'submit'; result: RunResult } | null>(null);
  const [focused, setFocused] = useState(false);
  const [picker, setPicker] = useState(false);
  const [pythonWarm, setPythonWarm] = useState(() => sandbox.isWarm('python'));
  // 키보드 처리: OS 가 창을 줄여주면(Android adjustResize) 그만큼은 여백에서 뺀다
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const editorRef = useRef<CodeEditorHandle>(null);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 웹에서는 툴바 버튼을 누르는 순간 에디터 포커스가 빠지므로, 숨김을 잠깐 미뤄 클릭이 전달되게 한다
  const onFocusChange = useCallback((next: boolean) => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    if (next || Platform.OS !== 'web') setFocused(next);
    else blurTimer.current = setTimeout(() => setFocused(false), 300);
  }, []);

  // 에디터의 첫 문서 (이후 변경은 에디터가 직접 관리)
  const [initialCode] = useState(() =>
    problem ? (useDrafts.getState().drafts[draftKey(id, language)] ?? starterCode(language, problem.signature)) : '',
  );

  useEffect(() => sandbox.onWarmChange(() => setPythonWarm(sandbox.isWarm('python'))), []);
  useEffect(() => {
    if (language === 'python') sandbox.warmup('python');
  }, [language]);
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    [],
  );

  if (!problem) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState title="문제를 찾을 수 없어요" action={<Button title="돌아가기" onPress={() => router.back()} />} />
      </SafeAreaView>
    );
  }

  const switchLanguage = async (next: SolveLanguage) => {
    setPicker(false);
    if (next === language) return;
    const current = await editorRef.current?.getDoc();
    if (current !== undefined) setDraft(problem.id, language, current);
    const code = useDrafts.getState().drafts[draftKey(problem.id, next)] ?? starterCode(next, problem.signature);
    setLanguage(next);
    setLastLanguage(problem.id, next);
    editorRef.current?.setDoc(code);
    setResult(null);
    haptic('selection');
  };

  const resetCode = async () => {
    const ok = await confirmAsync('코드 초기화', '작성한 코드를 지우고 기본 코드로 되돌릴까요?', '초기화', true);
    if (!ok) return;
    clearDraft(problem.id, language);
    editorRef.current?.setDoc(starterCode(language, problem.signature));
  };

  const execute = async (kind: 'run' | 'submit') => {
    if (running) return;
    haptic('light');
    editorRef.current?.blur();
    const code = (await editorRef.current?.getDoc()) ?? initialCode;
    setDraft(problem.id, language, code);
    const tests = kind === 'run' ? problem.examples : [...problem.examples, ...problem.tests];
    setRunning(kind);
    setStatus('');
    setProgress({ done: 0, total: tests.length });
    setPanel('result');
    abortRef.current = new AbortController();
    const res = await runSolution(
      {
        language,
        code,
        signature: problem.signature,
        tests,
        visibleCount: problem.examples.length,
        compare: problem.compare ?? 'exact',
        timeLimitMs: TIME_LIMIT_MS[language],
      },
      {
        runnerUrl: settings.runnerUrl.trim(),
        onStatus: setStatus,
        onProgress: (done, total) => setProgress({ done, total }),
        signal: abortRef.current.signal,
      },
    );
    // 화면을 떠나 취소된 실행은 결과·제출 기록을 남기지 않는다
    if (res.status === 'cancelled') return;
    setRunning(null);
    setResult({ kind, result: res });
    if (res.status === 'ok') {
      const s = summarize(res);
      if (kind === 'submit') recordSubmission(problem.id, { passed: s.passed, total: s.total, language });
      haptic(s.allPassed ? 'success' : 'error');
    } else if (res.status !== 'unavailable') {
      haptic('error');
    }
  };

  const nextProblem = () => {
    const solved = useProgress.getState().problems;
    const idx = ALL_PROBLEMS.findIndex((p) => p.id === problem.id);
    const rest = [...ALL_PROBLEMS.slice(idx + 1), ...ALL_PROBLEMS.slice(0, idx)];
    const next = rest.find((p) => !solved[p.id]?.solved) ?? rest[0];
    if (next) router.replace(`/algorithm/problem/${next.id}`);
  };

  const info = SOLVE_LANGUAGE_MAP[language];
  const keyboardOpen = keyboardHeight > 0;
  const resizedByOs = keyboardOpen && fullHeight > 0 ? Math.max(0, fullHeight - layoutHeight) : 0;
  const keyboardSpacer = keyboardOpen ? Math.max(0, keyboardHeight - resizedByOs) : 0;
  const resultBadge = result?.result.status === 'ok' ? summarize(result.result) : null;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: c.surface }]}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        setLayoutHeight(h);
        // 세로 고정 앱이므로 지금까지 본 가장 큰 높이를 키보드가 없을 때의 높이로 본다
        setFullHeight((prev) => Math.max(prev, h));
      }}>
      {/* 상단 바 */}
      <View style={[styles.topBar, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="뒤로 가기">
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text variant="headline" numberOfLines={1} style={{ flex: 1 }}>
          {problem.title}
        </Text>
        <Pressable
          onPress={() => setPicker(true)}
          style={[styles.langButton, { backgroundColor: c.surfaceAlt }]}
          accessibilityLabel={`언어 선택, 현재 ${info.label}`}>
          <Text variant="captionStrong">{info.label}</Text>
          <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
        </Pressable>
        <Pressable onPress={resetCode} hitSlop={10} accessibilityLabel="코드 초기화">
          <Ionicons name="refresh" size={22} color={c.textSecondary} />
        </Pressable>
      </View>

      {/* 패널 탭 */}
      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        {(
          [
            { key: 'problem', label: '문제' },
            { key: 'code', label: '코드' },
            { key: 'result', label: '결과' },
          ] as { key: Panel; label: string }[]
        ).map((t) => {
          const active = panel === t.key;
          return (
            <Pressable key={t.key} onPress={() => setPanel(t.key)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              <View style={styles.tabLabel}>
                <Text variant="subhead" weight={active ? '700' : '500'} color={active ? 'text' : 'textTertiary'}>
                  {t.label}
                </Text>
                {t.key === 'result' && resultBadge && (
                  <Badge
                    label={`${resultBadge.passed}/${resultBadge.total}`}
                    tone={resultBadge.allPassed ? 'success' : 'danger'}
                  />
                )}
                {t.key === 'result' && running && <View style={[styles.dot, { backgroundColor: c.primary }]} />}
              </View>
              <View style={[styles.tabIndicator, { backgroundColor: active ? c.text : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>

      {/* 패널 */}
      <View style={[styles.flex, { backgroundColor: c.bg }]}>
        <View style={[styles.flex, panel !== 'problem' && styles.hidden]}>
          <ScrollView contentContainerStyle={styles.panelScroll}>
            <View style={styles.panelInner}>
              <ProblemStatement problem={problem} language={language} />
            </View>
          </ScrollView>
        </View>
        <View style={[styles.flex, panel !== 'code' && styles.hidden]}>
          {language === 'python' && !pythonWarm && (
            <View style={[styles.notice, { backgroundColor: c.primarySoft }]}>
              <Ionicons name="cloud-download-outline" size={15} color={c.primary} />
              <Text variant="small" tint={c.primary} style={{ flex: 1 }}>
                Python 실행 환경을 준비하고 있어요 (처음 한 번만 다운로드)
              </Text>
            </View>
          )}
          {!info.local && !settings.runnerUrl.trim() && (
            <View style={[styles.notice, { backgroundColor: c.warningSoft }]}>
              <Ionicons name="information-circle-outline" size={15} color={c.warning} />
              <Text variant="small" tint={c.warning} style={{ flex: 1 }}>
                {info.label} 채점에는 실행 서버가 필요해요. 코드 작성은 그대로 가능해요.
              </Text>
            </View>
          )}
          <CodeEditor
            ref={editorRef}
            initialDoc={initialCode}
            language={language}
            scheme={scheme}
            fontSize={settings.editorFontSize}
            onChange={(doc) => setDraft(problem.id, language, doc)}
            onFocusChange={onFocusChange}
          />
        </View>
        <View style={[styles.flex, panel !== 'result' && styles.hidden]}>
          <ScrollView contentContainerStyle={styles.panelScroll}>
            <View style={styles.panelInner}>
              <RunResultView
                running={!!running}
                status={status}
                progress={progress}
                kind={result?.kind ?? running ?? undefined}
                result={running ? null : result?.result}
                params={problem.signature.params}
                onOpenSettings={() => router.push('/settings')}
                onChangeLanguage={() => setPicker(true)}
                onShowSolution={() => router.push({ pathname: '/algorithm/problem/[id]', params: { id: problem.id, tab: 'solution' } })}
                onNextProblem={() => showInterstitialAtBreak(nextProblem)}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 하단: 키보드가 열려 있으면 기호 툴바, 아니면 실행 버튼 */}
      {keyboardOpen || (Platform.OS === 'web' && focused) ? (
        <KeyboardToolbar editorRef={editorRef} language={language} />
      ) : null}
      {!keyboardOpen && (
        <View style={[styles.actionBar, { borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            title="실행"
            icon="play"
            variant="secondary"
            style={{ flex: 1 }}
            loading={running === 'run'}
            disabled={!!running}
            onPress={() => execute('run')}
          />
          <Button
            title="제출 · 채점"
            icon="checkmark-done"
            style={{ flex: 1.4 }}
            tint={c.algo}
            loading={running === 'submit'}
            disabled={!!running}
            onPress={() => execute('submit')}
          />
        </View>
      )}
      {keyboardSpacer > 0 && <View style={{ height: keyboardSpacer }} />}

      {/* 언어 선택 */}
      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={() => setPicker(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + spacing.lg }]} onPress={() => {}}>
            <Text variant="title3">풀이 언어</Text>
            <Text variant="caption" color="textTertiary">
              언어별로 작성 중인 코드가 따로 저장돼요.
            </Text>
            {SOLVE_LANGUAGES.map((l) => {
              const selected = l.id === language;
              const remoteReady = !!settings.runnerUrl.trim();
              return (
                <Pressable
                  key={l.id}
                  onPress={() => switchLanguage(l.id)}
                  style={[styles.langRow, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primarySoft : c.surface }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{l.label}</Text>
                    <Text variant="caption" color="textTertiary">
                      {l.local ? '기기에서 바로 실행' : remoteReady ? '실행 서버에서 채점' : '실행 서버 연결 필요 (작성은 가능)'}
                    </Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hidden: { display: 'none' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10 },
  tabLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 8 },
  tabIndicator: { height: 2.5, width: '50%', borderRadius: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  panelScroll: { flexGrow: 1, alignItems: 'center', paddingBottom: spacing.xxxl },
  panelInner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, padding: spacing.xl, gap: spacing.lg },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 8 },
  actionBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5 },
});
