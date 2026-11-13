import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import type { CodeLanguage } from '@/content';
import { LANGUAGE_LABEL } from '@/lib/highlight';
import { useColors } from '@/theme/theme-provider';

/**
 * 코드 언어 선택 (코드 리뷰의 Spring Boot Java / Kotlin, 알고리즘 구현 예제의 5개 언어, 출력 맞추기 퀴즈의 4개 언어).
 * 언어가 하나뿐이면 칩은 그리지 않고 안내(hint)만 보여준다
 */
export function ReviewLanguageToggle<L extends CodeLanguage>({
  languages,
  value,
  onChange,
  hint,
  tint,
  disabled,
}: {
  languages: L[];
  value: L;
  onChange: (language: L) => void;
  hint?: string;
  /** 선택된 칩 색 (기본: 코드 리뷰 색) */
  tint?: string;
  /** 바꿀 수 없게 (퀴즈에서 답을 고른 뒤) */
  disabled?: boolean;
}) {
  const c = useColors();
  if (languages.length < 2) {
    return hint ? (
      <Text variant="small" color="textTertiary">
        {hint}
      </Text>
    ) : null;
  }
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="코드 언어">
      <Text variant="caption" color="textTertiary">
        코드 언어
      </Text>
      <View style={styles.chips}>
        {languages.map((l) => (
          <Chip
            key={l}
            label={LANGUAGE_LABEL[l] ?? l}
            selected={value === l}
            onPress={() => onChange(l)}
            tint={tint ?? c.review}
            disabled={disabled}
          />
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
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flexShrink: 1 },
  hint: { flexBasis: '100%' },
});
