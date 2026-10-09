import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CodeBlock } from '@/components/code-block';
import { DiffView } from '@/components/diff-view';
import { ReviewLanguageToggle } from '@/components/review-language-toggle';
import { Inline, RichText } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, SectionHeader } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { PATTERN_MAP, resolvePattern, REVIEW_CATEGORY_LABEL, REVIEW_CONTENT, REVIEW_FRAMEWORK_MAP } from '@/content';
import { useReviewLanguage } from '@/features/progress/review-language';
import { useProgress } from '@/features/progress/store';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

type View_ = 'before' | 'after' | 'diff';

export default function PatternScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const base = PATTERN_MAP[id];
  const { language, languages, setLanguage } = useReviewLanguage(base?.framework ?? 'spring');
  const pattern = base ? resolvePattern(base, language) : undefined;
  const read = useProgress((s) => !!s.patterns[id]);
  const markPatternRead = useProgress((s) => s.markPatternRead);
  const bookmarked = useProgress((s) => !!s.bookmarks[id]);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const [view, setView] = useState<View_>('before');

  if (!pattern) {
    return (
      <Screen>
        <EmptyState title="콘텐츠를 찾을 수 없어요" />
      </Screen>
    );
  }

  const fw = REVIEW_FRAMEWORK_MAP[pattern.framework];
  const list = REVIEW_CONTENT[pattern.framework].patterns;
  const idx = list.findIndex((p) => p.id === pattern.id);
  const next = list[idx + 1];

  const complete = () => {
    markPatternRead(pattern.id);
    haptic('success');
    if (next) router.replace(`/review/pattern/${next.id}`);
    else router.back();
  };

  return (
    <Screen
      footer={
        <Button
          title={next ? (read ? '다음 패턴' : '학습 완료 · 다음 패턴') : read ? '목록으로' : '학습 완료'}
          icon={read ? 'arrow-forward' : 'checkmark'}
          tint={c.review}
          style={{ flex: 1 }}
          onPress={complete}
        />
      }>
      <Stack.Screen
        options={{
          title: fw.title,
          headerRight: () => (
            <Pressable
              onPress={() => {
                haptic('selection');
                toggleBookmark(pattern.id, 'pattern');
              }}
              hitSlop={10}
              accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}>
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? c.warning : c.text} />
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: spacing.sm }}>
        <View style={styles.badges}>
          <Badge label={REVIEW_CATEGORY_LABEL[pattern.category]} tone="review" />
          <DifficultyBadge level={pattern.difficulty} />
          {pattern.subFramework && <Badge label={pattern.subFramework} />}
          {read && <Badge label="학습 완료" tone="success" icon="checkmark" />}
        </View>
        <Text variant="title2">{pattern.title}</Text>
        <Text variant="callout" color="textSecondary">
          {pattern.summary}
        </Text>
      </View>

      <ReviewLanguageToggle languages={languages} value={language} onChange={setLanguage} />

      <Card style={{ gap: spacing.sm }}>
        <Text variant="captionStrong" tint={c.danger}>
          문제 상황
        </Text>
        <RichText text={pattern.problem} variant="callout" />
      </Card>

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: 'before', label: '개선 전' },
          { value: 'after', label: '개선 후' },
          { value: 'diff', label: '변경점' },
        ]}
      />
      {view === 'before' && (
        <CodeBlock
          code={pattern.before.source}
          language={pattern.before.language}
          filename={pattern.before.filename}
          label="개선 전"
          labelColor={c.danger}
        />
      )}
      {view === 'after' && (
        <CodeBlock
          code={pattern.after.source}
          language={pattern.after.language}
          filename={pattern.after.filename}
          label="개선 후"
          labelColor={c.success}
        />
      )}
      {view === 'diff' && <DiffView before={pattern.before.source} after={pattern.after.source} language={pattern.after.language} />}

      <SectionHeader title="개선 포인트" />
      <Card>
        <RichText text={pattern.explanation} variant="callout" />
      </Card>

      <SectionHeader title="리뷰 체크리스트" subtitle="비슷한 코드를 리뷰할 때 확인해보세요" />
      <Card style={{ gap: spacing.md }}>
        {pattern.checklist.map((item, i) => (
          <View key={i} style={styles.check}>
            <Ionicons name="checkbox-outline" size={20} color={c.review} />
            <View style={{ flex: 1 }}>
              <Inline text={item} variant="callout" />
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  check: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
