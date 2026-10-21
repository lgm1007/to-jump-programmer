import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider, IconBadge, ListRow, SectionHeader } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { DEV_TRACK_LABEL, REVIEW_FRAMEWORK_MAP } from '@/content';
import { courseFrameworks } from '@/features/progress/course';
import { againCardIds, trackSummary, wrongQuestionIds } from '@/features/progress/selectors';
import { useProgress } from '@/features/progress/store';
import { computeBestStreak, computeStreak } from '@/lib/date';
import { LANGUAGE_LABEL } from '@/lib/highlight';
import { GITHUB_URL, openExternal } from '@/lib/links';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function MeTab() {
  const c = useColors();
  const state = useProgress();
  const { profile } = state;
  const summary = useMemo(() => trackSummary(state), [state]);
  const streak = computeStreak(state.activity);
  const best = computeBestStreak(state.activity);
  const total = Object.values(state.activity).reduce((a, b) => a + b, 0);
  const wrong = wrongQuestionIds(state.quiz).length;
  const again = againCardIds(state).length;
  const bookmarks = Object.keys(state.bookmarks).length;

  return (
    <Screen edges={['top']}>
      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <Text variant="title2" tint="#FFFFFF">
            {profile.nickname.slice(0, 1) || 'G'}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="title2" numberOfLines={1}>
            {profile.nickname || '게스트'}
          </Text>
          <View style={styles.badges}>
            <Badge label={profile.goal === 'new' ? '신입 취업 준비' : '경력 이직 준비'} tone="primary" />
            <Badge label={LANGUAGE_LABEL[profile.language]} />
            <Badge label={DEV_TRACK_LABEL[profile.track]} tone="primary" />
            {courseFrameworks(profile).map((f) => (
              <Badge key={f} label={REVIEW_FRAMEWORK_MAP[f].title} />
            ))}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Ionicons
            name="logo-github"
            size={24}
            color={c.textSecondary}
            onPress={() => openExternal(GITHUB_URL)}
            accessibilityRole="link"
            accessibilityLabel="GitHub 저장소 열기"
          />
          <Ionicons name="settings-outline" size={24} color={c.textSecondary} onPress={() => router.push('/settings')} accessibilityLabel="설정" />
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard icon="flame" color={c.warning} soft={c.warningSoft} label="연속 학습" value={`${streak}일`} />
        <StatCard icon="trophy" color={c.primary} soft={c.primarySoft} label="최장 연속" value={`${best}일`} />
        <StatCard icon="layers" color={c.success} soft={c.successSoft} label="총 학습" value={`${total}`} />
      </View>

      <Card style={{ gap: spacing.md }}>
        <Text variant="headline">학습 기록</Text>
        <ActivityHeatmap activity={state.activity} goal={profile.dailyGoal} />
      </Card>

      <SectionHeader title="트랙별 진행 상황" />
      <Card style={{ gap: spacing.lg }}>
        <TrackRow
          title="알고리즘 유형 학습"
          color={c.algo}
          value={summary.algo.patterns ? summary.algo.patternsRead / summary.algo.patterns : 0}
          right={`${summary.algo.patternsRead}/${summary.algo.patterns}`}
        />
        <TrackRow
          title="알고리즘 개념 퀴즈"
          color={c.algo}
          value={summary.algo.quiz.progress}
          right={`${summary.algo.quiz.attempted}/${summary.algo.quiz.total} · 정답률 ${Math.round(summary.algo.quiz.accuracy * 100)}%`}
        />
        <TrackRow
          title="코드 리뷰 패턴 학습"
          color={c.review}
          value={summary.review.patterns ? summary.review.patternsRead / summary.review.patterns : 0}
          right={`${summary.review.patternsRead}/${summary.review.patterns}`}
        />
        <TrackRow
          title="리뷰 실전 퀴즈"
          color={c.review}
          value={summary.review.challenges ? summary.review.challengesDone / summary.review.challenges : 0}
          right={`${summary.review.challengesDone}/${summary.review.challenges}`}
        />
        <TrackRow
          title="CS 이론 학습"
          color={c.cs}
          value={summary.cs.lessons ? summary.cs.lessonsDone / summary.cs.lessons : 0}
          right={`${summary.cs.lessonsDone}/${summary.cs.lessons}`}
        />
        <TrackRow
          title="CS 퀴즈"
          color={c.cs}
          value={summary.cs.quiz.progress}
          right={`${summary.cs.quiz.attempted}/${summary.cs.quiz.total} · 정답률 ${Math.round(summary.cs.quiz.accuracy * 100)}%`}
        />
        <TrackRow
          title="면접 질문 카드"
          color={c.cs}
          value={summary.cs.cards ? summary.cs.cardsReviewed / summary.cs.cards : 0}
          right={`${summary.cs.cardsReviewed}/${summary.cs.cards}`}
        />
      </Card>

      <SectionHeader title="복습" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow
          title="오답노트"
          subtitle="가장 최근에 틀린 퀴즈"
          left={<IconBadge name="close-circle" color={c.danger} background={c.dangerSoft} size={36} />}
          right={<Badge label={`${wrong}`} tone={wrong ? 'danger' : 'neutral'} />}
          onPress={() => router.push('/notes')}
        />
        <Divider />
        <ListRow
          title="다시 볼 면접 질문"
          subtitle="'다시 볼래요 · 애매해요'로 표시한 카드"
          left={<IconBadge name="repeat" color={c.warning} background={c.warningSoft} size={36} />}
          right={<Badge label={`${again}`} tone={again ? 'warning' : 'neutral'} />}
          onPress={() => router.push({ pathname: '/cards', params: { mode: 'again' } })}
        />
        <Divider />
        <ListRow
          title="북마크"
          subtitle="저장한 문제 · 카드 · 패턴"
          left={<IconBadge name="bookmark" color={c.primary} background={c.primarySoft} size={36} />}
          right={<Badge label={`${bookmarks}`} tone={bookmarks ? 'primary' : 'neutral'} />}
          onPress={() => router.push('/bookmarks')}
        />
      </Card>

      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {!profile.onboarded && (
          <>
            <ListRow
              title="내 코스 설정하기"
              subtitle="코스 · 언어 · 하루 목표를 정하면 맞춤 추천을 받아요"
              left={<IconBadge name="sparkles" color={c.primary} background={c.primarySoft} size={36} />}
              onPress={() => router.push('/onboarding')}
            />
            <Divider />
          </>
        )}
        <ListRow
          title="설정"
          left={<IconBadge name="settings-outline" color={c.textSecondary} background={c.surfaceAlt} size={36} />}
          onPress={() => router.push('/settings')}
        />
        <Divider />
        <ListRow
          title="서비스 소개"
          left={<IconBadge name="information-circle-outline" color={c.textSecondary} background={c.surfaceAlt} size={36} />}
          onPress={() => router.push('/about')}
        />
      </Card>
    </Screen>
  );
}

function StatCard({ icon, color, soft, label, value }: { icon: string; color: string; soft: string; label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <IconBadge name={icon} color={color} background={soft} size={32} />
      <Text variant="title3">{value}</Text>
      <Text variant="small" color="textTertiary">
        {label}
      </Text>
    </Card>
  );
}

function TrackRow({ title, color, value, right }: { title: string; color: string; value: number; right: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="subhead" weight="600">
          {title}
        </Text>
        <Text variant="caption" color="textTertiary">
          {right}
        </Text>
      </View>
      <ProgressBar value={value} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, gap: 6, alignItems: 'flex-start' },
});
