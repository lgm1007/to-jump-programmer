import { StyleSheet, View } from 'react-native';

import { Inline, RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { topicLabel, type AlgoProblem, type SolveLanguage } from '@/content';
import { formatValue } from '@/features/runner/core/compare';
import { signatureText } from '@/features/runner/core/languages';
import { useColors } from '@/theme/theme-provider';
import { fonts, radius, spacing } from '@/theme/tokens';

/** 문제 지문 (문제 상세 · 풀이 화면 공용) */
export function ProblemStatement({ problem, language, compact }: { problem: AlgoProblem; language: SolveLanguage; compact?: boolean }) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.lg }}>
      {!compact && (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.badges}>
            <DifficultyBadge level={problem.level} prefix="Lv" />
            {problem.topics.map((t) => (
              <Badge key={t} label={topicLabel(t)} tone="algo" />
            ))}
          </View>
          <Text variant="title2">{problem.title}</Text>
        </View>
      )}

      <RichText text={problem.description} variant="callout" />

      <View style={{ gap: spacing.sm }}>
        <Text variant="headline">제한사항</Text>
        <View style={{ gap: 6 }}>
          {problem.constraints.map((line, i) => (
            <View key={i} style={styles.bullet}>
              <Text variant="callout" color="textTertiary" style={{ width: 14 }}>
                •
              </Text>
              <View style={{ flex: 1 }}>
                <Inline text={line} variant="callout" />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="headline">함수 형태</Text>
        <View style={[styles.signature, { backgroundColor: c.codeBg, borderColor: c.border }]}>
          <Text variant="caption" style={{ fontFamily: fonts.mono }} tint={c.codeText}>
            {signatureText(language, problem.signature)}
          </Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="headline">입출력 예</Text>
        {problem.examples.map((ex, i) => (
          <Card key={i} style={{ gap: spacing.sm, backgroundColor: c.surfaceAlt }} padded>
            <Text variant="captionStrong" color="textTertiary">
              예제 {i + 1}
            </Text>
            {problem.signature.params.map((p, j) => (
              <ValueRow key={p.name} label={p.name} value={formatValue(ex.input[j], 600)} />
            ))}
            <ValueRow label="result" value={formatValue(ex.output, 600)} highlight />
          </Card>
        ))}
        {problem.exampleNotes && <RichText text={problem.exampleNotes} variant="callout" />}
      </View>
    </View>
  );
}

function ValueRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.valueRow}>
      <Text variant="small" style={{ fontFamily: fonts.mono, width: 92 }} tint={highlight ? c.primary : c.textTertiary} numberOfLines={1}>
        {label}
      </Text>
      <Text variant="caption" style={{ fontFamily: fonts.mono, flex: 1 }} tint={highlight ? c.primary : c.text} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  bullet: { flexDirection: 'row', gap: 4 },
  signature: { padding: spacing.md, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth },
  valueRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
