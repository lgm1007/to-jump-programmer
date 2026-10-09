import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useColors } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme/tokens';

export interface ScreenProps {
  children: ReactNode;
  /** 스크롤 가능 여부 (기본 true) */
  scroll?: boolean;
  /** 좌우 여백 (기본 true) */
  padded?: boolean;
  edges?: Edge[];
  /** 하단 고정 영역 (CTA 버튼 등) */
  footer?: ReactNode;
  background?: 'bg' | 'surface';
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = [],
  footer,
  background = 'bg',
  contentStyle,
  scrollProps,
}: ScreenProps) {
  const c = useColors();
  const bg = background === 'bg' ? c.bg : c.surface;
  const inner = [styles.inner, padded && styles.padded, contentStyle];
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: bg }]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, footer ? null : styles.bottomGap]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          {...scrollProps}>
          <View style={inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.center]}>
          <View style={[styles.flex, inner]}>{children}</View>
        </View>
      )}
      {footer && <Footer>{footer}</Footer>}
    </SafeAreaView>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.surface, borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }}>
      <View style={styles.footerInner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  bottomGap: { paddingBottom: spacing.xxxl },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, gap: spacing.lg },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  footerInner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
