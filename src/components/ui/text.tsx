import { Text as RNText, type TextProps } from 'react-native';

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
}

export function Text({ variant = 'body', color = 'text', tint, weight, align, style, ...rest }: AppTextProps) {
  const colors = useColors();
  return (
    <RNText
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
