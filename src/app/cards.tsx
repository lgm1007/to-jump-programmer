import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar } from '@/components/ui/progress';
import { Footer } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CARD_MAP, CS_CATEGORY_MAP, CS_CONTENT } from '@/content';
import { showInterstitialAtBreak } from '@/features/ads';
import { againCardIds } from '@/features/progress/selectors';
import { useProgress, type CardRating } from '@/features/progress/store';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme/tokens';

type Params = { category?: string; ids?: string; mode?: string; start?: string; title?: string };

function resolveCards(p: Params): { ids: string[]; title: string } {
  if (p.mode === 'again') {
    return { ids: againCardIds(useProgress.getState()), title: p.title ?? '다시 볼 면접 질문' };
  }
  if (p.category) {
    const ids = (CS_CONTENT[p.category]?.cards ?? []).map((c) => c.id);
    return { ids, title: p.title ?? `${CS_CATEGORY_MAP[p.category]?.title ?? ''} 면접 질문` };
  }
  return { ids: (p.ids ?? '').split(',').filter((id) => CARD_MAP[id]), title: p.title ?? '면접 질문' };
}

const RATINGS: { value: CardRating; label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'danger' | 'warning' | 'success' }[] = [
  { value: 'again', label: '다시 볼래요', icon: 'refresh', tone: 'danger' },
  { value: 'hard', label: '애매해요', icon: 'help-circle', tone: 'warning' },
  { value: 'good', label: '말할 수 있어요', icon: 'checkmark-circle', tone: 'success' },
];

export default function CardsScreen() {
  const c = useColors();
  const params = useLocalSearchParams<Params>();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => resolveCards(params), []);
  const [ids, setIds] = useState(initial.ids);
  const [index, setIndex] = useState(() => Math.min(Number(params.start ?? 0) || 0, Math.max(0, initial.ids.length - 1)));
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, CardRating>>({});
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const rateCard = useProgress((s) => s.rateCard);
  const bookmarks = useProgress((s) => s.bookmarks);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);

  const card = CARD_MAP[ids[index]];
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!card) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]}>
        <Header onClose={close} progress={0} label="" />
        <EmptyState icon="chatbubbles-outline" title="볼 카드가 없어요" description="다른 카테고리의 질문을 골라보세요." action={<Button title="돌아가기" onPress={close} />} />
      </SafeAreaView>
    );
  }

  if (finished) {
    const counts = { again: 0, hard: 0, good: 0 };
    Object.values(ratings).forEach((r) => counts[r]++);
    const retry = ids.filter((id) => ratings[id] && ratings[id] !== 'good');
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]} edges={['top']}>
        <Header onClose={close} progress={1} label="완료" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.inner}>
            <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
              <Text style={{ fontSize: 48, lineHeight: 56 }}>🎤</Text>
              <Text variant="title2">{initial.title} 완료!</Text>
              <Text variant="callout" color="textTertiary" align="center">
                소리 내어 답해보는 연습이 실제 면접에서 큰 차이를 만들어요.
              </Text>
              <View style={styles.countRow}>
                {RATINGS.map((r) => (
                  <View key={r.value} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                    <Text variant="title2" tint={c[r.tone]}>
                      {counts[r.value]}
                    </Text>
                    <Text variant="caption" color="textTertiary">
                      {r.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </ScrollView>
        <Footer>
          {retry.length > 0 && (
            <Button
              title={`${retry.length}개 다시 보기`}
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => {
                setIds(retry);
                setIndex(0);
                setRevealed(false);
                setChecked(new Set());
                setRatings({});
                setFinished(false);
              }}
            />
          )}
          <Button title="완료" style={{ flex: 1 }} onPress={() => showInterstitialAtBreak(close)} />
        </Footer>
      </SafeAreaView>
    );
  }

  const rate = (r: CardRating) => {
    rateCard(card.id, r);
    setRatings((prev) => ({ ...prev, [card.id]: r }));
    haptic(r === 'good' ? 'success' : 'light');
    if (index + 1 >= ids.length) setFinished(true);
    else {
      setIndex(index + 1);
      setRevealed(false);
      setChecked(new Set());
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const bookmarked = !!bookmarks[card.id];
  const category = CS_CATEGORY_MAP[card.categoryId];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]} edges={['top']}>
      <Header onClose={close} progress={index / ids.length} label={`${index + 1}/${ids.length}`} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <Card style={{ gap: spacing.lg, paddingVertical: spacing.xl }}>
            <View style={styles.metaRow}>
              <Badge label={category?.title ?? ''} tone="cs" icon="chatbubbles" />
              <DifficultyBadge level={card.difficulty} />
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => {
                  haptic('selection');
                  toggleBookmark(card.id, 'card');
                }}
                hitSlop={10}
                accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}>
                <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? c.warning : c.textTertiary} />
              </Pressable>
            </View>
            <Text variant="caption" tint={c.cs} weight="700">
              Q. 면접관 질문
            </Text>
            <Text variant="title2">{card.question}</Text>
            {!revealed && (
              <View style={[styles.tip, { backgroundColor: c.surfaceAlt }]}>
                <Ionicons name="mic-outline" size={18} color={c.textSecondary} />
                <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
                  답변을 먼저 소리 내어 말해본 뒤, 모범 답안과 비교해보세요. 30초~1분 분량이 적당해요.
                </Text>
              </View>
            )}
          </Card>

          {revealed && (
            <>
              <Card style={{ gap: spacing.md }}>
                <Text variant="captionStrong" tint={c.success}>
                  모범 답안
                </Text>
                <RichText text={card.answer} variant="callout" />
              </Card>
              <Card style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="captionStrong" color="textTertiary">
                    핵심 키워드 — 내 답변에 들어간 것을 체크해보세요
                  </Text>
                  <Text variant="captionStrong" tint={c.primary}>
                    {checked.size}/{card.keywords.length}
                  </Text>
                </View>
                <View style={styles.keywords}>
                  {card.keywords.map((k) => {
                    const on = checked.has(k);
                    return (
                      <Pressable
                        key={k}
                        onPress={() => {
                          haptic('selection');
                          setChecked((prev) => {
                            const next = new Set(prev);
                            if (next.has(k)) next.delete(k);
                            else next.add(k);
                            return next;
                          });
                        }}
                        style={[styles.keyword, { backgroundColor: on ? c.primary : c.primarySoft }]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}>
                        {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                        <Text variant="subhead" tint={on ? '#FFFFFF' : c.primary} weight="600">
                          {k}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
              {card.followUps && card.followUps.length > 0 && (
                <Card style={{ gap: spacing.sm }}>
                  <Text variant="captionStrong" color="textTertiary">
                    예상 꼬리 질문
                  </Text>
                  {card.followUps.map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                      <Ionicons name="return-down-forward" size={16} color={c.textTertiary} style={{ marginTop: 3 }} />
                      <Text variant="callout" style={{ flex: 1 }}>
                        {f}
                      </Text>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <Footer>
        {revealed ? (
          RATINGS.map((r) => (
            <PressableScale
              key={r.value}
              onPress={() => rate(r.value)}
              accessibilityRole="button"
              accessibilityLabel={r.label}
              style={[styles.rateBtn, { backgroundColor: c[`${r.tone}Soft` as const] }]}>
              <Ionicons name={r.icon} size={20} color={c[r.tone]} />
              <Text variant="captionStrong" tint={c[r.tone]}>
                {r.label}
              </Text>
            </PressableScale>
          ))
        ) : (
          <Button
            title="모범 답안 보기"
            icon="eye-outline"
            style={{ flex: 1 }}
            tint={c.cs}
            onPress={() => {
              haptic('light');
              setRevealed(true);
            }}
          />
        )}
      </Footer>
    </SafeAreaView>
  );
}

function Header({ onClose, progress, label }: { onClose: () => void; progress: number; label: string }) {
  const c = useColors();
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="닫기">
        <Ionicons name="close" size={26} color={c.text} />
      </Pressable>
      <ProgressBar value={progress} style={{ flex: 1 }} height={8} color={c.cs} />
      <Text variant="captionStrong" color="textSecondary" style={{ minWidth: 40, textAlign: 'right' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: spacing.xxxl },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tip: { flexDirection: 'row', gap: 8, padding: spacing.md, borderRadius: radius.md, alignItems: 'flex-start' },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyword: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  rateBtn: { flex: 1, height: 58, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  countRow: { flexDirection: 'row', width: '100%', marginTop: spacing.sm },
});
