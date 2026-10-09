import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider, EmptyState, IconBadge, ListRow, SectionHeader } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CARD_MAP, CHALLENGE_MAP, PATTERN_MAP, PROBLEM_MAP, QUESTION_MAP } from '@/content';
import { plainText } from '@/lib/markdown';
import { useProgress } from '@/features/progress/store';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export default function BookmarksScreen() {
  const c = useColors();
  const bookmarks = useProgress((s) => s.bookmarks);
  const entries = Object.entries(bookmarks).sort((a, b) => b[1].at - a[1].at);
  const questions = entries.filter(([id]) => QUESTION_MAP[id]).map(([id]) => id);
  const cards = entries.filter(([id]) => CARD_MAP[id]).map(([id]) => id);
  const problems = entries.filter(([id]) => PROBLEM_MAP[id]).map(([id]) => id);
  const patterns = entries.filter(([id]) => PATTERN_MAP[id]).map(([id]) => id);
  const challenges = entries.filter(([id]) => CHALLENGE_MAP[id]).map(([id]) => id);
  const empty = !questions.length && !cards.length && !problems.length && !patterns.length && !challenges.length;

  return (
    <Screen>
      <Stack.Screen options={{ title: '북마크' }} />
      {empty && (
        <EmptyState
          icon="bookmark-outline"
          title="북마크가 없어요"
          description="퀴즈, 면접 카드, 문제, 리뷰 패턴 화면의 북마크 아이콘을 눌러 저장해보세요."
        />
      )}

      {questions.length > 0 && (
        <Section title="퀴즈" count={questions.length}>
          {questions.map((id, i) => (
            <View key={id}>
              {i > 0 && <Divider />}
              <ListRow
                title={plainText(QUESTION_MAP[id].prompt.split('\n')[0])}
                left={<IconBadge name="help-circle" color={c.cs} background={c.csSoft} size={32} />}
                onPress={() => router.push({ pathname: '/quiz', params: { mode: 'ids', ids: id, title: '북마크 퀴즈' } })}
              />
            </View>
          ))}
          <Button
            title="북마크 퀴즈 모두 풀기"
            size="sm"
            variant="secondary"
            style={{ marginBottom: spacing.md }}
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'bookmarks' } })}
          />
        </Section>
      )}

      {cards.length > 0 && (
        <Section title="면접 질문" count={cards.length}>
          {cards.map((id, i) => (
            <View key={id}>
              {i > 0 && <Divider />}
              <ListRow
                title={CARD_MAP[id].question}
                left={<IconBadge name="chatbubbles" color={c.cs} background={c.csSoft} size={32} />}
                onPress={() => router.push({ pathname: '/cards', params: { ids: id, title: '북마크 질문' } })}
              />
            </View>
          ))}
          <Button
            title="북마크 질문 모두 연습하기"
            size="sm"
            variant="secondary"
            style={{ marginBottom: spacing.md }}
            onPress={() => router.push({ pathname: '/cards', params: { ids: cards.join(','), title: '북마크 질문' } })}
          />
        </Section>
      )}

      {problems.length > 0 && (
        <Section title="코딩 문제" count={problems.length}>
          {problems.map((id, i) => (
            <View key={id}>
              {i > 0 && <Divider />}
              <ListRow
                title={PROBLEM_MAP[id].title}
                subtitle={`Lv.${PROBLEM_MAP[id].level}`}
                left={<IconBadge name="code-slash" color={c.algo} background={c.algoSoft} size={32} />}
                onPress={() => router.push(`/algorithm/problem/${id}`)}
              />
            </View>
          ))}
        </Section>
      )}

      {(patterns.length > 0 || challenges.length > 0) && (
        <Section title="코드 리뷰" count={patterns.length + challenges.length}>
          {patterns.map((id, i) => (
            <View key={id}>
              {i > 0 && <Divider />}
              <ListRow
                title={PATTERN_MAP[id].title}
                subtitle="개선 패턴"
                left={<IconBadge name="book" color={c.review} background={c.reviewSoft} size={32} />}
                onPress={() => router.push(`/review/pattern/${id}`)}
              />
            </View>
          ))}
          {challenges.map((id, i) => (
            <View key={id}>
              {(i > 0 || patterns.length > 0) && <Divider />}
              <ListRow
                title={CHALLENGE_MAP[id].title}
                subtitle="리뷰 퀴즈"
                left={<IconBadge name="git-pull-request" color={c.review} background={c.reviewSoft} size={32} />}
                onPress={() => router.push(`/review/challenge/${id}`)}
              />
            </View>
          ))}
        </Section>
      )}
    </Screen>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={title} subtitle={`${count}개`} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {children}
      </Card>
      <Text variant="small" color="textTertiary">
        {' '}
      </Text>
    </View>
  );
}
