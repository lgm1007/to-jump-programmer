import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { tidyCode } from '@/lib/markdown';
import { diffLines, diffStats } from '@/lib/diff';
import { useColors } from '@/theme/theme-provider';

import { CodeBlock, type LineMark } from './code-block';
import { Text } from './ui/text';

/** 개선 전/후 코드의 줄 단위 변경점 */
export function DiffView({ before, after, language }: { before: string; after: string; language: string }) {
  const c = useColors();
  const { code, marks, stats, labels } = useMemo(() => {
    const lines = diffLines(tidyCode(before), tidyCode(after));
    const m: Record<number, LineMark> = {};
    lines.forEach((l, i) => {
      if (l.type === 'add') m[i + 1] = 'add';
      else if (l.type === 'del') m[i + 1] = 'del';
    });
    const labels = lines.map((l) => (l.type === 'add' ? '+' : l.type === 'del' ? '−' : String(l.newNo ?? '')));
    return { code: lines.map((l) => l.text).join('\n'), marks: m, stats: diffStats(lines), labels };
  }, [before, after]);

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.legend}>
        <Text variant="small" tint={c.codeAddText} weight="700">
          + {stats.added}줄 추가
        </Text>
        <Text variant="small" tint={c.codeDelText} weight="700">
          − {stats.removed}줄 삭제
        </Text>
      </View>
      <CodeBlock code={code} language={language} marks={marks} label="변경점" showLineNumbers lineLabels={labels} />
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 12 },
});
