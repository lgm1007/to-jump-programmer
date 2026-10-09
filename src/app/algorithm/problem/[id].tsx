import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CodeBlock } from '@/components/code-block';
import { ProblemStatement } from '@/components/problem-statement';
import { RichText } from '@/components/rich-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, EmptyState } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { PROBLEM_MAP, type SolveLanguage } from '@/content';
import { useProgress } from '@/features/progress/store';
import { SOLVE_LANGUAGES } from '@/features/runner/core/languages';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type Tab = 'problem' | 'hints' | 'solution';

export default function ProblemScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const id = params.id;
  const problem = PROBLEM_MAP[id];
  const language = useProgress((s) => s.profile.language);
  const record = useProgress((s) => s.problems[id]);
  const bookmarked = useProgress((s) => !!s.bookmarks[id]);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const [tab, setTab] = useState<Tab>(params.tab === 'solution' ? 'solution' : params.tab === 'hints' ? 'hints' : 'problem');
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionUnlocked, setSolutionUnlocked] = useState(params.tab === 'solution');
  const [solutionLang, setSolutionLang] = useState<SolveLanguage>(language);

  if (!problem) {
    return (
      <Screen>
        <EmptyState title="문제를 찾을 수 없어요" />
      </Screen>
    );
  }

  const unlocked = solutionUnlocked || record?.solved;

  return (
    <Screen
      footer={
        <Button
          title={record?.solved ? '다시 풀어보기' : record ? '이어서 풀기' : '코드 작성하기'}
          icon="code-slash"
          style={{ flex: 1 }}
          tint={c.algo}
          onPress={() => router.push(`/algorithm/solve/${problem.id}`)}
        />
      }>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable
              onPress={() => {
                haptic('selection');
                toggleBookmark(problem.id, 'problem');
              }}
              hitSlop={10}
              accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}>
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? c.warning : c.text} />
            </Pressable>
          ),
        }}
      />
      {record && (
        <Card tint={record.solved ? c.successSoft : c.warningSoft} style={styles.status}>
          <Ionicons name={record.solved ? 'checkmark-circle' : 'time-outline'} size={20} color={record.solved ? c.success : c.warning} />
          <Text variant="subhead" tint={record.solved ? c.success : c.warning}>
            {record.solved
              ? `해결한 문제예요 · 제출 ${record.submissions}회`
              : `최고 ${record.bestPassed}/${record.total} 통과 · 제출 ${record.submissions}회`}
          </Text>
        </Card>
      )}
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'problem', label: '문제' },
          { value: 'hints', label: `힌트 ${problem.hints.length}` },
          { value: 'solution', label: '해설' },
        ]}
      />

      {tab === 'problem' && <ProblemStatement problem={problem} language={language} />}

      {tab === 'hints' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="callout" color="textTertiary">
            막혔을 때 하나씩 열어보세요. 힌트를 볼수록 스스로 생각할 기회는 줄어들어요.
          </Text>
          {problem.hints.map((h, i) =>
            i < hintsShown ? (
              <Card key={i} style={{ gap: 6 }}>
                <Text variant="captionStrong" tint={c.primary}>
                  힌트 {i + 1}
                </Text>
                <RichText text={h} variant="callout" />
              </Card>
            ) : (
              <Pressable
                key={i}
                disabled={i !== hintsShown}
                onPress={() => {
                  haptic('light');
                  setHintsShown(i + 1);
                }}
                style={[styles.lockedHint, { borderColor: c.border, opacity: i === hintsShown ? 1 : 0.5 }]}>
                <Ionicons name="lock-closed" size={16} color={c.textTertiary} />
                <Text variant="subhead" color="textSecondary">
                  힌트 {i + 1} 열기
                </Text>
              </Pressable>
            ),
          )}
        </View>
      )}

      {tab === 'solution' &&
        (unlocked ? (
          <View style={{ gap: spacing.lg }}>
            <Card style={{ gap: spacing.md }}>
              <RichText text={problem.explanation} variant="callout" />
              <View style={[styles.complexity, { backgroundColor: c.surfaceAlt }]}>
                <View style={{ flex: 1 }}>
                  <Text variant="small" color="textTertiary">
                    시간 복잡도
                  </Text>
                  <Text variant="bodyStrong">{problem.complexity.time}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="small" color="textTertiary">
                    공간 복잡도
                  </Text>
                  <Text variant="bodyStrong">{problem.complexity.space}</Text>
                </View>
              </View>
            </Card>
            <Text variant="headline">모범 답안</Text>
            <View style={styles.langChips}>
              {SOLVE_LANGUAGES.map((l) => (
                <Chip key={l.id} label={l.label} selected={solutionLang === l.id} onPress={() => setSolutionLang(l.id)} tint={c.algo} />
              ))}
            </View>
            <CodeBlock code={problem.solutions[solutionLang]} language={solutionLang} />
          </View>
        ) : (
          <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
            <Ionicons name="lock-closed" size={32} color={c.textTertiary} />
            <Text variant="headline" align="center">
              먼저 직접 풀어보는 걸 추천해요
            </Text>
            <Text variant="callout" color="textTertiary" align="center">
              문제를 해결하면 해설이 자동으로 열려요.{'\n'}그래도 지금 보고 싶다면 아래 버튼을 눌러주세요.
            </Text>
            <Button
              title="해설 바로 보기"
              variant="secondary"
              size="md"
              onPress={() => {
                haptic('light');
                setSolutionUnlocked(true);
              }}
            />
          </Card>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  lockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  complexity: { flexDirection: 'row', gap: spacing.lg, padding: spacing.md, borderRadius: radius.md },
  langChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
