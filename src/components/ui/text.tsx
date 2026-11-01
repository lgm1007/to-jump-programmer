import { Platform, Text as RNText, type TextProps } from 'react-native';

import { useColors } from '@/theme/theme-provider';
import { typography, type Colors, type TypographyVariant } from '@/theme/tokens';

type ColorKey = keyof Pick<
  Colors,
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'textInverse'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'algo'
  | 'review'
  | 'cs'
>;

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorKey;
  /** 임의 색상 (color 보다 우선) */
  tint?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'left' | 'center' | 'right';
  /** 제목 단계 — 웹에서 <h1>~<h3> 으로 그려 문서 구조를 알린다 (검색 · 광고 심사 크롤러, 스크린 리더) */
  heading?: HeadingLevel;
}

export type HeadingLevel = 1 | 2 | 3;

/** 제목 단계의 접근성 속성. RN Web 은 role="heading" + aria-level 을 <h1>~<h6> 으로 그린다 (aria-level 은 네이티브 타입에 없어 웹에서만) */
export function headingProps(level?: HeadingLevel): TextProps {
  if (!level) return {};
  return { role: 'heading', ...(Platform.OS === 'web' ? ({ 'aria-level': level } as object) : null) };
}

export function Text({ variant = 'body', color = 'text', tint, weight, align, heading, style, ...rest }: AppTextProps) {
  const colors = useColors();
  return (
    <RNText
      {...headingProps(heading)}
      style={[
        typography[variant],
        { color: tint ?? colors[color] },
        weight && { fontWeight: weight },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
