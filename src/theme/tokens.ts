import { Platform, type TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

const light = {
  bg: '#F2F4F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F8FA',
  surfacePressed: '#EEF0F3',
  border: '#E5E8EB',
  borderStrong: '#D1D6DB',
  text: '#191F28',
  textSecondary: '#4E5968',
  textTertiary: '#8B95A1',
  textInverse: '#FFFFFF',
  primary: '#3182F6',
  primaryPressed: '#1B64DA',
  primarySoft: '#E8F3FF',
  success: '#0FAF73',
  successSoft: '#E5F7EF',
  danger: '#F04452',
  dangerSoft: '#FFEDEE',
  warning: '#F59E0B',
  warningSoft: '#FFF4E0',
  algo: '#3182F6',
  algoSoft: '#E8F3FF',
  review: '#0FA37F',
  reviewSoft: '#E3F6F0',
  cs: '#7C5CFF',
  csSoft: '#F0ECFF',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: '#0B1A33',
  // 코드 (GitHub Light 계열)
  codeBg: '#F6F8FA',
  codeText: '#1F2328',
  codeLineNo: '#8C959F',
  codeKeyword: '#CF222E',
  codeString: '#0A3069',
  codeComment: '#6E7781',
  codeNumber: '#0550AE',
  codeFunction: '#8250DF',
  codeType: '#953800',
  codeAnnotation: '#116329',
  codeSelected: '#FFF1C2',
  codeIssue: '#FFE3E5',
  codeAdd: '#E6FFEC',
  codeAddText: '#116329',
  codeDel: '#FFEBE9',
  codeDelText: '#A40E26',
};

export type Colors = typeof light;

const dark: Colors = {
  bg: '#0E1013',
  surface: '#1A1D22',
  surfaceAlt: '#22262C',
  surfacePressed: '#2A2F36',
  border: '#2B3038',
  borderStrong: '#3A404A',
  text: '#F2F4F6',
  textSecondary: '#B3BAC4',
  textTertiary: '#7F8893',
  textInverse: '#FFFFFF',
  primary: '#4D94FF',
  primaryPressed: '#3B82F6',
  primarySoft: '#16263D',
  success: '#2CC98A',
  successSoft: '#11302A',
  danger: '#FF6370',
  dangerSoft: '#3A1D22',
  warning: '#FBBF24',
  warningSoft: '#3A2D12',
  algo: '#4D94FF',
  algoSoft: '#16263D',
  review: '#2CC9A0',
  reviewSoft: '#103029',
  cs: '#9B83FF',
  csSoft: '#25203F',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  // 코드 (GitHub Dark 계열)
  codeBg: '#14181D',
  codeText: '#E6EDF3',
  codeLineNo: '#6E7681',
  codeKeyword: '#FF7B72',
  codeString: '#A5D6FF',
  codeComment: '#8B949E',
  codeNumber: '#79C0FF',
  codeFunction: '#D2A8FF',
  codeType: '#FFA657',
  codeAnnotation: '#7EE787',
  codeSelected: '#4A3F14',
  codeIssue: '#4B1F24',
  codeAdd: '#12301F',
  codeAddText: '#7EE787',
  codeDel: '#3B1A1F',
  codeDelText: '#FFA198',
};

export const palettes: Record<ColorScheme, Colors> = { light, dark };

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fonts = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  }) as string,
};

type Variant =
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'subhead'
  | 'caption'
  | 'captionStrong'
  | 'small';

export const typography: Record<Variant, TextStyle> = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  title1: { fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  title2: { fontSize: 22, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  title3: { fontSize: 19, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400', letterSpacing: -0.1 },
  bodyStrong: { fontSize: 16, lineHeight: 25, fontWeight: '600', letterSpacing: -0.1 },
  callout: { fontSize: 15, lineHeight: 23, fontWeight: '400', letterSpacing: -0.1 },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
};

export type TypographyVariant = Variant;

export interface Theme {
  scheme: ColorScheme;
  colors: Colors;
}

export const MAX_CONTENT_WIDTH = 720;
