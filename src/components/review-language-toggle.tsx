import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import type { CodeLanguage } from '@/content';
import { LANGUAGE_LABEL } from '@/lib/highlight';
import { useColors } from '@/theme/theme-provider';

/** 코드 리뷰 코드 언어 선택 (예: Spring Boot 의 Java / Kotlin). 언어가 하나뿐이면 그리지 않는다 */
export function ReviewLanguageToggle({
  languages,
  value,
  onChange,
  hint,
}: {
  languages: CodeLanguage[];
  value: CodeLanguage;
  onChange: (language: CodeLanguage) => void;
  hint?: string;
}) {
  const c = useColors();
  if (languages.length < 2) return null;
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="코드 언어">
      <Text variant="caption" color="textTertiary">
        코드 언어
      </Text>
      <View style={styles.chips}>
        {languages.map((l) => (
          <Chip key={l} label={LANGUAGE_LABEL[l] ?? l} selected={value === l} onPress={() => onChange(l)} tint={c.review} />
        ))}
      </View>
      {!!hint && (
        <Text variant="small" color="textTertiary" style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', gap: 6 },
  hint: { flexBasis: '100%' },
});
