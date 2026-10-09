import Ionicons from '@expo/vector-icons/Ionicons';
import { Fragment, useMemo } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { parseInline, parseMarkdown, type InlineSpan } from '@/lib/markdown';
import { useColors } from '@/theme/theme-provider';
import { fonts, radius, spacing, typography, type TypographyVariant } from '@/theme/tokens';

import { CodeBlock } from './code-block';

export function InlineText({
  spans,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: {
  spans: InlineSpan[];
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const c = useColors();
  const base = typography[variant];
  return (
    <RNText style={[base, { color: color ?? c.text }, style]} numberOfLines={numberOfLines}>
      {spans.map((s, i) =>
        s.code ? (
          <RNText
            key={i}
            style={{
              fontFamily: fonts.mono,
              fontSize: (base.fontSize ?? 16) - 1.5,
              color: c.codeKeyword,
              backgroundColor: c.codeBg,
              fontWeight: s.bold ? '700' : '400',
            }}>
            {` ${s.text} `}
          </RNText>
        ) : (
          <RNText key={i} style={s.bold ? { fontWeight: '700', color: color ?? c.text } : undefined}>
            {s.text}
          </RNText>
        ),
      )}
    </RNText>
  );
}

/** 인라인 마크다운(굵게·코드)만 있는 한 줄 텍스트 */
export function Inline({
  text,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: {
  text: string;
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const spans = useMemo(() => parseInline(text), [text]);
  return <InlineText spans={spans} variant={variant} color={color} style={style} numberOfLines={numberOfLines} />;
}

export function RichText({
  text,
  variant = 'body',
  color,
  style,
  codeFontSize = 12.5,
}: {
  text: string;
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<ViewStyle>;
  codeFontSize?: number;
}) {
  const c = useColors();
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  const textColor = color ?? c.text;
  return (
    <View style={[styles.container, style]}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'paragraph':
            return (
              <InlineText
                key={i}
                variant={variant}
                color={textColor}
                spans={b.lines.flatMap((line, li) => (li === 0 ? line : [{ text: '\n' }, ...line]))}
              />
            );
          case 'heading':
            return (
              <InlineText key={i} variant="headline" color={textColor} spans={b.spans} style={i > 0 ? styles.headingGap : undefined} />
            );
          case 'bullet':
            return (
              <View key={i} style={styles.list}>
                {b.items.map((spans, j) => (
                  <View key={j} style={styles.listItem}>
                    <RNText style={[typography[variant], { color: c.textTertiary, width: 14 }]}>•</RNText>
                    <View style={{ flex: 1 }}>
                      <InlineText variant={variant} color={textColor} spans={spans} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'ordered':
            return (
              <View key={i} style={styles.list}>
                {b.items.map((item, j) => (
                  <View key={j} style={styles.listItem}>
                    <RNText style={[typography[variant], { color: c.primary, fontWeight: '700', minWidth: 20 }]}>{item.n}.</RNText>
                    <View style={{ flex: 1 }}>
                      <InlineText variant={variant} color={textColor} spans={item.spans} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return (
              <View key={i} style={[styles.quote, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="bulb" size={16} color={c.primary} style={{ marginTop: 3 }} />
                <View style={{ flex: 1 }}>
                  <InlineText
                    variant={variant === 'body' ? 'callout' : variant}
                    color={textColor}
                    spans={b.lines.flatMap((line, li) => (li === 0 ? line : [{ text: '\n' }, ...line]))}
                  />
                </View>
              </View>
            );
          case 'code':
            return <CodeBlock key={i} code={b.code} language={b.lang} fontSize={codeFontSize} />;
          case 'table':
            return (
              <ScrollView key={i} horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.table, { borderColor: c.border }]}>
                  <View style={[styles.tr, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                    {b.header.map((cell, k) => (
                      <View key={k} style={[styles.td, { borderColor: c.border }, k === 0 && styles.firstCol]}>
                        <InlineText variant="captionStrong" color={textColor} spans={cell} />
                      </View>
                    ))}
                  </View>
                  {b.rows.map((row, r) => (
                    <View key={r} style={[styles.tr, { borderColor: c.border }]}>
                      {b.header.map((_, k) => (
                        <View key={k} style={[styles.td, { borderColor: c.border }, k === 0 && styles.firstCol]}>
                          <InlineText variant="caption" color={textColor} spans={row[k] ?? []} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            );
          default:
            return <Fragment key={i} />;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  headingGap: { marginTop: spacing.xs },
  list: { gap: 6 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  quote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  td: { width: 132, paddingHorizontal: 10, paddingVertical: 8, borderLeftWidth: StyleSheet.hairlineWidth },
  firstCol: { borderLeftWidth: 0, width: 116 },
});
