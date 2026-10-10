import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ReviewLanguageToggle } from '@/components/review-language-toggle';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Chip, Divider, EmptyState } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import {
  resolveChallenge,
  resolvePattern,
  REVIEW_CATEGORY_LABEL,
  REVIEW_CONTENT,
  REVIEW_FRAMEWORKS,
  type FrameworkId,
  type ReviewCategory,
} from '@/content';
import { AdSlot } from '@/features/ads';
import { useReviewLanguage } from '@/features/progress/review-language';
import { useProgress } from '@/features/progress/store';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type Tab = 'patterns' | 'challenges';

export default function ReviewTab() {
  const c = useColors();
  const framework = useProgress((s) => s.profile.framework);
  const updateProfile = useProgress((s) => s.updateProfile);
  const readPatterns = useProgress((s) => s.patterns);
  const challenges = useProgress((s) => s.challenges);
  const [tab, setTab] = useState<Tab>('patterns');
  const [category, setCategory] = useState<ReviewCategory | null>(null);
  const { language, languages, setLanguage } = useReviewLanguage(framework);

  const content = REVIEW_CONTENT[framework];
  const categories = [...new Set(content.patterns.map((p) => p.category))];
  const patterns = content.patterns.filter((p) => !category || p.category === category);
  const readCount = content.patterns.filter((p) => readPatterns[p.id]).length;
  const doneCount = content.challenges.filter((ch) => challenges[ch.id]).length;

  const selectFramework = (id: FrameworkId) => {
    if (id === framework) return;
    haptic('selection');
    setCategory(null);
    updateProfile({ framework: id });
  };

  return (
    <Screen edges={['top']}>
      <View style={{ gap: 4, paddingTop: spacing.sm }}>
        <Text variant="title1">코드 리뷰</Text>
        <Text variant="callout" color="textTertiary">
          실무에서 자주 지적되는 패턴을 익히고, 직접 리뷰해봐요
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {REVIEW_FRAMEWORKS.map((f) => {
          const active = f.id === framework;
          const total = REVIEW_CONTENT[f.id].patterns.length + REVIEW_CONTENT[f.id].challenges.length;
          return (
            <PressableScale
              key={f.id}
              onPress={() => selectFramework(f.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.fwCard,
                { backgroundColor: active ? f.accent : c.surface, borderColor: active ? f.accent : c.border },
              ]}>
              <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={20} color={active ? '#fff' : f.accent} />
              <View>
                <Text variant="subhead" weight="700" tint={active ? '#FFFFFF' : c.text}>
                  {f.title}
                </Text>
                <Text variant="small" tint={active ? 'rgba(255,255,255,0.8)' : c.textTertiary}>
                  {total}개 콘텐츠
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      <ReviewLanguageToggle languages={languages} value={language} onChange={setLanguage} />

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'patterns', label: `개선 패턴 학습 ${content.patterns.length}` },
          { value: 'challenges', label: `리뷰 실전 퀴즈 ${content.challenges.length}` },
        ]}
      />

      {tab === 'patterns' ? (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.progressCard}>
            <Text variant="subhead" style={{ flex: 1 }}>
              학습 완료 {readCount}/{content.patterns.length}
            </Text>
            <View style={{ flex: 1.3 }}>
              <ProgressBar value={content.patterns.length ? readCount / content.patterns.length : 0} color={c.review} />
            </View>
          </Card>
          {categories.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="전체" selected={!category} onPress={() => setCategory(null)} tint={c.review} />
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={REVIEW_CATEGORY_LABEL[cat]}
                  selected={category === cat}
                  onPress={() => setCategory(category === cat ? null : cat)}
                  tint={c.review}
                />
              ))}
            </ScrollView>
          )}
          {patterns.length === 0 ? (
            <EmptyState icon="construct-outline" title="콘텐츠를 준비하고 있어요" />
          ) : (
            <Card padded={false}>
              {patterns.map((base, i) => {
                const p = resolvePattern(base, language);
                const read = !!readPatterns[p.id];
                return (
                  <View key={p.id}>
                    {i > 0 && <Divider inset={spacing.lg} />}
                    <Card onPress={() => router.push(`/review/pattern/${p.id}`)} tint="transparent" style={styles.row}>
                      <Ionicons
                        name={read ? 'checkmark-circle' : 'book-outline'}
                        size={22}
                        color={read ? c.success : c.textTertiary}
                      />
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text variant="bodyStrong" numberOfLines={2}>
                          {p.title}
                        </Text>
                        <Text variant="caption" color="textTertiary" numberOfLines={2}>
                          {p.summary}
                        </Text>
                        <View style={styles.badges}>
                          <Badge label={REVIEW_CATEGORY_LABEL[p.category]} tone="review" />
                          <DifficultyBadge level={p.difficulty} />
                          {p.subFramework && <Badge label={p.subFramework} />}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                    </Card>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.howto} tint={c.reviewSoft}>
            <Ionicons name="bulb" size={18} color={c.review} />
            <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
              문제가 있는 코드 줄을 직접 찾아 탭하고, 문제점을 고른 뒤, 베스트 개선안과 비교해요.
            </Text>
          </Card>
          <Card style={styles.progressCard}>
            <Text variant="subhead" style={{ flex: 1 }}>
              도전 완료 {doneCount}/{content.challenges.length}
            </Text>
            <View style={{ flex: 1.3 }}>
              <ProgressBar value={content.challenges.length ? doneCount / content.challenges.length : 0} color={c.review} />
            </View>
          </Card>
          {content.challenges.length === 0 ? (
            <EmptyState icon="construct-outline" title="콘텐츠를 준비하고 있어요" />
          ) : (
            content.challenges.map((base, i) => {
              const ch = resolveChallenge(base, language);
              const rec = challenges[ch.id];
              return (
                <Card key={ch.id} onPress={() => router.push(`/review/challenge/${ch.id}`)} style={styles.challenge}>
                  <View style={[styles.num, { backgroundColor: rec ? c.reviewSoft : c.surfaceAlt }]}>
                    <Text variant="captionStrong" tint={rec ? c.review : c.textSecondary}>
                      {String(i + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {ch.title}
                    </Text>
                    <View style={styles.badges}>
                      <DifficultyBadge level={ch.difficulty} />
                      <Badge label={`이슈 ${ch.issues.length}개`} />
                      {ch.subFramework && <Badge label={ch.subFramework} />}
                      {rec && <Badge label={`최고 ${rec.best}점`} tone={rec.best >= 80 ? 'success' : 'warning'} />}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                </Card>
              );
            })
          )}
        </View>
      )}
      <AdSlot />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fwCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 0, borderWidth: 0, shadowOpacity: 0 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  howto: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  challenge: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  num: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
