import Ionicons from '@expo/vector-icons/Ionicons';
import type { RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { SolveLanguage } from '@/content/types';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { fonts, radius } from '@/theme/tokens';

import type { CodeEditorHandle } from './types';

type Key =
  | { label: string; insert: string }
  | { label: string; pair: [string, string] }
  | { label: string; icon: keyof typeof Ionicons.glyphMap; action: 'indent' | 'outdent' | 'undo' | 'redo' | 'blur' };

const COMMON: Key[] = [
  { label: 'Tab', icon: 'arrow-forward', action: 'indent' },
  { label: '( )', pair: ['(', ')'] },
  { label: '[ ]', pair: ['[', ']'] },
  { label: '{ }', pair: ['{', '}'] },
  { label: '" "', pair: ['"', '"'] },
  { label: "' '", pair: ["'", "'"] },
  { label: '=', insert: '=' },
  { label: ':', insert: ':' },
  { label: ';', insert: ';' },
  { label: ',', insert: ', ' },
  { label: '.', insert: '.' },
  { label: '<', insert: '<' },
  { label: '>', insert: '>' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '*', insert: '*' },
  { label: '/', insert: '/' },
  { label: '%', insert: '%' },
  { label: '!', insert: '!' },
  { label: '&', insert: '&' },
  { label: '|', insert: '|' },
  { label: '_', insert: '_' },
  { label: '#', insert: '#' },
];

const SNIPPETS: Record<SolveLanguage, Key[]> = {
  python: [
    { label: 'range()', pair: ['range(', ')'] },
    { label: 'len()', pair: ['len(', ')'] },
    { label: '.append()', pair: ['.append(', ')'] },
    { label: 'in', insert: ' in ' },
  ],
  javascript: [
    { label: '=>', insert: ' => ' },
    { label: '===', insert: ' === ' },
    { label: '.length', insert: '.length' },
    { label: '.push()', pair: ['.push(', ')'] },
  ],
  java: [
    { label: '.length', insert: '.length' },
    { label: '.size()', insert: '.size()' },
    { label: '.get()', pair: ['.get(', ')'] },
    { label: 'new', insert: 'new ' },
  ],
  cpp: [
    { label: '::', insert: '::' },
    { label: '.size()', insert: '.size()' },
    { label: '.push_back()', pair: ['.push_back(', ')'] },
    { label: '<<', insert: ' << ' },
  ],
};

export function KeyboardToolbar({ editorRef, language }: { editorRef: RefObject<CodeEditorHandle | null>; language: SolveLanguage }) {
  const c = useColors();
  const press = (k: Key) => {
    const editor = editorRef.current;
    if (!editor) return;
    haptic('selection');
    if ('insert' in k) editor.insert(k.insert);
    else if ('pair' in k) editor.insertPair(k.pair[0], k.pair[1]);
    else editor[k.action]();
  };
  const keys = [...COMMON.slice(0, 1), ...SNIPPETS[language], ...COMMON.slice(1)];
  return (
    <View style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.keys}>
        {keys.map((k) => (
          <Pressable
            key={k.label}
            onPress={() => press(k)}
            accessibilityRole="button"
            accessibilityLabel={k.label}
            style={({ pressed }) => [styles.key, { backgroundColor: pressed ? c.surfacePressed : c.surfaceAlt }]}>
            {'icon' in k ? (
              <Ionicons name={k.icon} size={16} color={c.text} />
            ) : (
              <Text variant="subhead" style={{ fontFamily: fonts.mono }}>
                {k.label}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
      <View style={[styles.fixed, { borderLeftColor: c.border }]}>
        <Pressable onPress={() => editorRef.current?.undo()} hitSlop={6} style={styles.iconKey} accessibilityLabel="실행 취소">
          <Ionicons name="arrow-undo" size={19} color={c.textSecondary} />
        </Pressable>
        <Pressable onPress={() => editorRef.current?.redo()} hitSlop={6} style={styles.iconKey} accessibilityLabel="다시 실행">
          <Ionicons name="arrow-redo" size={19} color={c.textSecondary} />
        </Pressable>
        <Pressable onPress={() => editorRef.current?.blur()} hitSlop={6} style={styles.iconKey} accessibilityLabel="키보드 내리기">
          <Ionicons name="chevron-down" size={21} color={c.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, height: 46 },
  keys: { paddingHorizontal: 8, gap: 6, alignItems: 'center' },
  key: { minWidth: 38, height: 34, paddingHorizontal: 10, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fixed: { flexDirection: 'row', borderLeftWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  iconKey: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
});
