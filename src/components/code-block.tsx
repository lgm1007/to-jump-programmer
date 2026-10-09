import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';

import { tidyCode } from '@/lib/markdown';
import { highlightLines, LANGUAGE_LABEL, type Token, type TokenKind } from '@/lib/highlight';
import { useColors } from '@/theme/theme-provider';
import { fonts, radius, type Colors } from '@/theme/tokens';

import { Text } from './ui/text';

export type LineMark = 'selected' | 'hit' | 'miss' | 'wrong' | 'issue' | 'add' | 'del';

export interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  /** 라인을 눌러 선택하는 모드 */
  onLinePress?: (line: number) => void;
  marks?: Record<number, LineMark>;
  fontSize?: number;
  /** 헤더 숨김 */
  bare?: boolean;
  headerRight?: ReactNode;
  /** 헤더 왼쪽 라벨 (기본: 언어명) */
  label?: string;
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
  /** 처음부터 줄바꿈 모드 */
  initialWrap?: boolean;
  /** 줄 번호 대신 표시할 라벨 (diff 등) */
  lineLabels?: string[];
}

function webWhiteSpace(wrap: boolean) {
  return { whiteSpace: wrap ? 'pre-wrap' : 'pre' };
}

function tokenColor(kind: TokenKind, c: Colors): string {
  switch (kind) {
    case 'keyword':
      return c.codeKeyword;
    case 'string':
      return c.codeString;
    case 'comment':
      return c.codeComment;
    case 'number':
      return c.codeNumber;
    case 'function':
      return c.codeFunction;
    case 'type':
      return c.codeType;
    case 'annotation':
      return c.codeAnnotation;
    default:
      return c.codeText;
  }
}

function markBackground(mark: LineMark | undefined, c: Colors): string | undefined {
  switch (mark) {
    case 'selected':
      return c.codeSelected;
    case 'hit':
      return c.successSoft;
    case 'miss':
    case 'issue':
      return c.codeIssue;
    case 'wrong':
      return c.warningSoft;
    case 'add':
      return c.codeAdd;
    case 'del':
      return c.codeDel;
    default:
      return undefined;
  }
}

function markAccent(mark: LineMark | undefined, c: Colors): string | undefined {
  switch (mark) {
    case 'selected':
      return c.warning;
    case 'hit':
      return c.success;
    case 'miss':
    case 'issue':
      return c.danger;
    case 'wrong':
      return c.warning;
    default:
      return undefined;
  }
}

const Line = memo(function Line({
  tokens,
  n,
  label,
  showNo,
  gutterWidth,
  mark,
  fontSize,
  lineHeight,
  wrap,
  onPress,
  colors,
}: {
  tokens: Token[];
  n: number;
  label?: string;
  showNo: boolean;
  gutterWidth: number;
  mark?: LineMark;
  fontSize: number;
  lineHeight: number;
  wrap: boolean;
  onPress?: (n: number) => void;
  colors: Colors;
}) {
  const bg = markBackground(mark, colors);
  const accent = markAccent(mark, colors);
  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: accent ?? 'transparent' }]} />
      {showNo && (
        <RNText
          style={[
            styles.lineNo,
            { width: gutterWidth, fontSize: fontSize - 1, lineHeight, color: accent ?? colors.codeLineNo, fontFamily: fonts.mono },
          ]}>
          {label ?? (mark === 'add' ? '+' : mark === 'del' ? '-' : n)}
        </RNText>
      )}
      <RNText
        style={[
          styles.code,
          { fontSize, lineHeight, fontFamily: fonts.mono, color: colors.codeText },
          wrap && styles.wrapText,
          // react-native-web 는 numberOfLines 가 있으면 white-space: nowrap 이라 들여쓰기 공백이 접힌다
          Platform.OS === 'web' && (webWhiteSpace(wrap) as object),
        ]}
        numberOfLines={wrap || Platform.OS === 'web' ? undefined : 1}>
        {tokens.length === 0 ? ' ' : tokens.map((t, i) => (
          <RNText key={i} style={{ color: tokenColor(t.kind, colors), fontStyle: t.kind === 'comment' ? 'italic' : 'normal' }}>
            {t.text}
          </RNText>
        ))}
      </RNText>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(n)}
        accessibilityRole="button"
        accessibilityLabel={`${n}번째 줄`}
        accessibilityState={{ selected: !!mark }}
        style={({ pressed }) => [styles.line, { backgroundColor: pressed ? colors.surfacePressed : bg }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.line, bg ? { backgroundColor: bg } : null]}>{content}</View>;
});

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers,
  onLinePress,
  marks,
  fontSize = 13,
  bare,
  headerRight,
  label,
  labelColor,
  style,
  initialWrap = false,
  lineLabels,
}: CodeBlockProps) {
  const c = useColors();
  const [wrap, setWrap] = useState(initialWrap);
  const source = useMemo(() => tidyCode(code), [code]);
  const lines = useMemo(() => highlightLines(source, language), [source, language]);
  const showNo = showLineNumbers ?? lines.length > 3;
  const gutterWidth = Math.max(2, String(lines.length).length) * (fontSize * 0.62) + 10;
  const lineHeight = Math.round(fontSize * 1.55);

  const body = (
    <View style={[styles.body, { minWidth: '100%' }]}>
      {lines.map((tokens, idx) => (
        <Line
          key={idx}
          tokens={tokens}
          n={idx + 1}
          label={lineLabels?.[idx]}
          showNo={showNo}
          gutterWidth={gutterWidth}
          mark={marks?.[idx + 1]}
          fontSize={fontSize}
          lineHeight={lineHeight}
          wrap={wrap}
          onPress={onLinePress}
          colors={c}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.codeBg, borderColor: c.border }, style]}>
      {!bare && (
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <View style={styles.headerLeft}>
            <Text variant="small" tint={labelColor ?? c.textTertiary} weight="700">
              {label ?? LANGUAGE_LABEL[language] ?? language}
            </Text>
            {filename && (
              <Text variant="small" color="textTertiary" numberOfLines={1} style={{ flexShrink: 1 }}>
                {filename}
              </Text>
            )}
          </View>
          {headerRight}
          <Pressable
            onPress={() => setWrap((w) => !w)}
            hitSlop={8}
            accessibilityRole="switch"
            accessibilityLabel="줄바꿈"
            accessibilityState={{ checked: wrap }}
            style={styles.wrapBtn}>
            <Ionicons name="return-down-back" size={14} color={wrap ? c.primary : c.textTertiary} />
            <Text variant="small" tint={wrap ? c.primary : c.textTertiary}>
              줄바꿈
            </Text>
          </Pressable>
        </View>
      )}
      {wrap ? (
        <View style={styles.pad}>{body}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pad, { minWidth: '100%' }]}>
          {body}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  wrapBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pad: { paddingVertical: 8 },
  body: { flexDirection: 'column' },
  line: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 14 },
  accent: { width: 3, alignSelf: 'stretch' },
  lineNo: { textAlign: 'right', paddingRight: 10, opacity: 0.9 },
  code: { paddingLeft: 2 },
  wrapText: { flex: 1, flexWrap: 'wrap' },
});
