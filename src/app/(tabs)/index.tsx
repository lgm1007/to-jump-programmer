import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { InstallAppCard } from '@/components/install-app-card';
import { CaseBadge, LessonStatusBadge } from '@/components/lesson-status-badge';
import { Inline } from '@/components/rich-text';
import { Badge, DifficultyBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge, SectionHeader } from '@/components/ui/misc';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import {
  ALGO_PATTERN_MAP,
  ALGO_TOPIC_MAP,
  CARD_MAP,
  CHALLENGE_MAP,
  CS_CATEGORY_MAP,
  LESSON_MAP,
  PATTERN_MAP,
  resolveChallenge,
  resolvePattern,
  REVIEW_FRAMEWORK_MAP,
} from '@/content';
import { AdSlot } from '@/features/ads';
import { useReviewLanguageMap } from '@/features/progress/review-language';
import {
  answeredToday,
  pickReview,
  trackProgress,
  trackSummary,
  useDailyPlan,
  wrongQuestionIds,
} from '@/features/progress/selectors';
import { useProgress, useTodayCount } from '@/features/progress/store';
import { computeStreak } from '@/lib/date';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '늦은 시간까지 열공 중이네요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '좋은 오후예요';
  return '오늘 하루도 수고했어요';
}

export default function Home() {
  const c = useColors();
  const state = useProgress();
  const today = useTodayCount();
  const streak = computeStreak(state.activity);
  const goal = state.profile.dailyGoal;
  const plan = useDailyPlan();
  const quizTotal = plan.questionIds.length;
  const quizAnswered = answeredToday(plan, state.quiz);
  const quizDoneToday = quizTotal > 0 && quizAnswered.length === quizTotal;
  // 풀다 만 퀴즈는 남은 문제만 이어서 푼다
  const quizIds =
    quizAnswered.length > 0 && !quizDoneToday ? plan.questionIds.filter((id) => !quizAnswered.includes(id)) : plan.questionIds;
  const summary = useMemo(() => trackSummary(state), [state]);
  const progress = trackProgress(summary);
  const wrongCount = useMemo(() => wrongQuestionIds(state.quiz).length, [state.quiz]);

  const algoPattern = plan.algoPatternId ? ALGO_PATTERN_MAP[plan.algoPatternId] : undefined;
  const card = plan.cardId ? CARD_MAP[plan.cardId] : undefined;
  const lesson = plan.lessonId ? LESSON_MAP[plan.lessonId] : undefined;
  const review = pickReview(state);
  const reviewLanguage = useReviewLanguageMap();
  const reviewItem = !review
    ? undefined
    : review.kind === 'pattern'
      ? PATTERN_MAP[review.id] && resolvePattern(PATTERN_MAP[review.id], reviewLanguage(PATTERN_MAP[review.id].framework))
      : CHALLENGE_MAP[review.id] && resolveChallenge(CHALLENGE_MAP[review.id], reviewLanguage(CHALLENGE_MAP[review.id].framework));
  const fw = reviewItem ? REVIEW_FRAMEWORK_MAP[reviewItem.framework] : undefined;
  const goalDone = today >= goal;

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="subhead" color="textTertiary" numberOfLines={1}>
            {state.profile.nickname ? `${state.profile.nickname}님, ${greeting()}` : greeting()}
          </Text>
          <Text variant="title2" numberOfLines={2}>
            오늘도 한 단계 점프해볼까요?
          </Text>
        </View>
        <View style={[styles.streak, { backgroundColor: streak > 0 ? c.warningSoft : c.surface }]}>
          <Ionicons name="flame" size={16} color={streak > 0 ? c.warning : c.textTertiary} />
          <Text variant="captionStrong" tint={streak > 0 ? c.warning : c.textTertiary}>
            {streak}일
          </Text>
        </View>
      </View>

      {/* 웹으로 처음 방문해 아직 코스를 설정하지 않은 사람 — 서비스 소개와 코스 설정 */}
      {!state.profile.onboarded && <WelcomeCard />}

      {/* 오늘의 목표 */}
      <Card style={styles.goalCard}>
        <View style={styles.goalRow}>
          <ProgressRing
            value={today / goal}
            size={84}
            stroke={9}
            color={goalDone ? c.success : c.primary}
            label={`${Math.min(today, 999)}`}
            sublabel={`/ ${goal}`}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="headline">{goalDone ? '오늘 목표 달성! 🎉' : '오늘의 학습 목표'}</Text>
            <Text variant="caption" color="textTertiary">
              {goalDone
                ? '꾸준함이 실력이 돼요. 더 해볼까요?'
                : `${goal - today}개만 더 풀면 오늘 목표를 채워요.`}
            </Text>
          </View>
        </View>
        <Button
          title={
            !quizTotal
              ? '퀴즈 콘텐츠 준비 중'
              : quizDoneToday
                ? '오늘의 퀴즈 완료 · 다시 풀기'
                : quizAnswered.length > 0
                  ? `오늘의 퀴즈 이어 풀기 · ${quizAnswered.length}/${quizTotal}`
                  : `오늘의 퀴즈 ${quizTotal}문제 풀기`
          }
          icon={quizDoneToday ? 'checkmark-circle' : 'flash'}
          variant={quizDoneToday ? 'secondary' : 'primary'}
          disabled={!quizTotal}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'ids', ids: quizIds.join(','), title: '오늘의 퀴즈' } })}
        />
      </Card>

      {wrongCount > 0 && (
        <Card onPress={() => router.push('/notes')} style={styles.noteBanner} tint={c.dangerSoft}>
          <Ionicons name="refresh-circle" size={26} color={c.danger} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">오답노트에 {wrongCount}문제가 있어요</Text>
            <Text variant="caption" color="textSecondary">
              틀린 문제를 다시 풀면 자동으로 정리돼요
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        </Card>
      )}

      {/* 웹: 홈 화면 설치 안내 (닫으면 다시 보이지 않음) */}
      <InstallAppCard dismissible />

      <SectionHeader title="오늘의 추천" subtitle="매일 새로운 조합으로 추천해드려요" />
      <View style={{ gap: spacing.md }}>
        {algoPattern && (
          <Card onPress={() => router.push(`/algorithm/pattern/${algoPattern.id}`)} style={styles.recCard}>
            <IconBadge name="code-slash" color={c.algo} background={c.algoSoft} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="small" tint={c.algo} weight="700">
                오늘의 알고리즘 유형 · {ALGO_TOPIC_MAP[algoPattern.topicId]?.title}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {algoPattern.title}
              </Text>
              <View style={styles.badges}>
                <DifficultyBadge level={algoPattern.difficulty} />
                <Badge label={`구현 예제 ${algoPattern.implementations.length}가지`} />
                {state.algoPatterns[algoPattern.id] && <Badge label="학습 완료" tone="success" icon="checkmark" />}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </Card>
        )}
        {reviewItem && review && (
          <Card
            onPress={() =>
              router.push(review.kind === 'pattern' ? `/review/pattern/${reviewItem.id}` : `/review/challenge/${reviewItem.id}`)
            }
            style={styles.recCard}>
            <IconBadge name="git-pull-request" color={c.review} background={c.reviewSoft} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="small" tint={c.review} weight="700">
                오늘의 코드 리뷰 · {fw?.title}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {reviewItem.title}
              </Text>
              <Text variant="caption" color="textTertiary" numberOfLines={1}>
                {review.kind === 'pattern' ? '개선 패턴 학습' : '리뷰 실전 퀴즈'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </Card>
        )}
        {lesson && (
          <Card onPress={() => router.push(`/interview/lesson/${lesson.id}`)} style={styles.recCard}>
            <IconBadge name="book" color={c.cs} background={c.csSoft} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="small" tint={c.cs} weight="700">
                오늘의 CS 이론 · {CS_CATEGORY_MAP[lesson.categoryId]?.title}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {lesson.title}
              </Text>
              <View style={styles.badges}>
                <CaseBadge categoryId={lesson.categoryId} />
                <LessonStatusBadge lessonId={lesson.id} />
                <Badge label={`${lesson.minutes}분 읽기 · 확인 퀴즈`} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </Card>
        )}
        {card && (
          <Card onPress={() => router.push({ pathname: '/cards', params: { ids: card.id, title: '오늘의 면접 질문' } })} style={styles.recCard}>
            <IconBadge name="chatbubbles" color={c.cs} background={c.csSoft} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="small" tint={c.cs} weight="700">
                오늘의 면접 질문 · {CS_CATEGORY_MAP[card.categoryId]?.title}
              </Text>
              <Inline text={card.question} variant="bodyStrong" numberOfLines={2} />
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </Card>
        )}
      </View>

      <SectionHeader title="학습 트랙" />
      <View style={{ gap: spacing.md }}>
        <TrackCard
          title="알고리즘 · 코딩 테스트"
          icon="code-slash"
          color={c.algo}
          soft={c.algoSoft}
          value={progress.algo}
          detail={`유형 ${summary.algo.patternsRead}/${summary.algo.patterns} · 개념 퀴즈 ${summary.algo.quiz.attempted}/${summary.algo.quiz.total}`}
          onPress={() => router.push('/algorithm')}
        />
        <TrackCard
          title="코드 리뷰 테스트"
          icon="git-pull-request"
          color={c.review}
          soft={c.reviewSoft}
          value={progress.review}
          detail={`패턴 ${summary.review.patternsRead}/${summary.review.patterns} · 리뷰 퀴즈 ${summary.review.challengesDone}/${summary.review.challenges}`}
          onPress={() => router.push('/review')}
        />
        <TrackCard
          title="기술 면접 CS"
          icon="school"
          color={c.cs}
          soft={c.csSoft}
          value={progress.cs}
          detail={`이론 ${summary.cs.lessonsDone}/${summary.cs.lessons} · 퀴즈 ${summary.cs.quiz.attempted}/${summary.cs.quiz.total} · 카드 ${summary.cs.cardsReviewed}/${summary.cs.cards}`}
          onPress={() => router.push('/interview')}
        />
      </View>
      <AdSlot />
    </Screen>
  );
}

function WelcomeCard() {
  const c = useColors();
  return (
    <Card style={{ gap: spacing.md }} tint={c.primarySoft}>
      <View style={{ gap: 6 }}>
        <Text variant="headline">개발자 취업 · 이직, 하루 10분씩 준비해요</Text>
        <Text variant="callout" color="textSecondary">
          알고리즘 이론과 자주 나오는 유형의 5개 언어 구현 예제, 실무 코드 리뷰 테스트, 기술 면접 CS 이론 레슨과 퀴즈 ·
          질문 카드를 무료로 공부할 수 있어요. 지금은 기본 코스(백엔드 · Spring · Python)로 보여드리고 있어요.
        </Text>
      </View>
      <View style={styles.welcomeActions}>
        <Button title="내 코스로 시작하기" icon="sparkles" style={{ flex: 1 }} onPress={() => router.push('/onboarding')} />
        <Button title="서비스 소개" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/about')} />
      </View>
    </Card>
  );
}

function TrackCard({
  title,
  icon,
  color,
  soft,
  value,
  detail,
  onPress,
}: {
  title: string;
  icon: string;
  color: string;
  soft: string;
  value: number;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={{ gap: spacing.md }}>
      <View style={styles.trackTop}>
        <IconBadge name={icon} color={color} background={soft} size={36} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </Text>
        <Text variant="captionStrong" tint={color}>
          {Math.round(value * 100)}%
        </Text>
      </View>
      <ProgressBar value={value} color={color} />
      <Text variant="caption" color="textTertiary">
        {detail}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  goalCard: { gap: spacing.lg },
  welcomeActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  noteBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  trackTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
