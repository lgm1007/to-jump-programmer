import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/misc';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { REVIEW_FRAMEWORKS, type FrameworkId, type SolveLanguage } from '@/content';
import { useProgress, type CareerGoal } from '@/features/progress/store';
import { SOLVE_LANGUAGES } from '@/features/runner/core/languages';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme/tokens';

const STEPS = 4;

const FEATURES = [
  { icon: 'code-slash', title: '알고리즘 · 코딩 테스트', desc: '개념 퀴즈로 익히고 Python·Java·Kotlin·C++·JS로 직접 풀어요', tone: 'algo' },
  { icon: 'git-pull-request', title: '코드 리뷰 테스트', desc: 'Spring·NestJS·Django 코드의 문제를 찾고 개선해요', tone: 'review' },
  { icon: 'school', title: '기술 면접 CS', desc: 'OS·네트워크·DB부터 아키텍처까지 퀴즈와 질문 카드로', tone: 'cs' },
] as const;

const LANGUAGE_ICON: Record<SolveLanguage, keyof typeof Ionicons.glyphMap> = {
  python: 'logo-python',
  java: 'cafe-outline',
  kotlin: 'diamond-outline',
  cpp: 'hardware-chip-outline',
  javascript: 'logo-javascript',
};

const LANGUAGE_DESC: Record<SolveLanguage, string> = {
  python: '간결한 문법, 코딩 테스트에서 가장 많이 써요',
  java: '국내 백엔드 채용에서 가장 많이 쓰는 언어',
  kotlin: 'Spring Boot 를 Kotlin 으로 쓴다면',
  cpp: '빠른 실행 속도, STL 활용',
  javascript: 'Node.js 개발자라면 익숙한 언어로',
};

function OptionCard({
  selected,
  onPress,
  title,
  description,
  icon,
  accent,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  description?: string;
  icon?: string;
  accent?: string;
}) {
  const c = useColors();
  const color = accent ?? c.primary;
  return (
    <PressableScale
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.option,
        { backgroundColor: c.surface, borderColor: selected ? color : c.border, borderWidth: selected ? 2 : 1 },
      ]}>
      {icon && <IconBadge name={icon} color={color} background={selected ? `${color}22` : c.surfaceAlt} size={44} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="headline">{title}</Text>
        {description && (
          <Text variant="caption" color="textTertiary">
            {description}
          </Text>
        )}
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? color : c.borderStrong} />
    </PressableScale>
  );
}

export default function Onboarding() {
  const c = useColors();
  const completeOnboarding = useProgress((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [goal, setGoal] = useState<CareerGoal>('new');
  const [language, setLanguage] = useState<SolveLanguage>('python');
  const [framework, setFramework] = useState<FrameworkId>('spring');
  const [dailyGoal, setDailyGoal] = useState(10);

  const next = () => {
    haptic('light');
    if (step < STEPS) setStep(step + 1);
    else {
      completeOnboarding({ nickname: nickname.trim() || '개발자', goal, language, framework, dailyGoal });
      haptic('success');
      router.replace('/');
    }
  };

  const tones = { algo: c.algo, review: c.review, cs: c.cs } as const;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.surface }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step > 0 && (
          <View style={styles.topBar}>
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} accessibilityLabel="이전">
              <Ionicons name="chevron-back" size={26} color={c.text} />
            </Pressable>
            <View style={styles.dots}>
              {Array.from({ length: STEPS }, (_, i) => (
                <View
                  key={i}
                  style={[styles.dot, { backgroundColor: i < step ? c.primary : c.border, width: i === step - 1 ? 22 : 8 }]}
                />
              ))}
            </View>
            <View style={{ width: 26 }} />
          </View>
        )}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {step === 0 && (
              <View style={{ gap: spacing.xxl, paddingTop: spacing.xxxl }}>
                <View style={[styles.logo, { backgroundColor: c.primary }]}>
                  <Ionicons name="arrow-up" size={34} color="#fff" />
                </View>
                <View style={{ gap: spacing.sm }}>
                  <Text variant="display">개발자 취업·이직,{'\n'}To Jump Programmer{'\n'}하나로</Text>
                  <Text variant="body" color="textSecondary">
                    코딩 테스트부터 코드 리뷰, 기술 면접까지{'\n'}하루 10분씩 꾸준히 준비해요.
                  </Text>
                </View>
                <View style={{ gap: spacing.md }}>
                  {FEATURES.map((f) => (
                    <View key={f.title} style={[styles.feature, { backgroundColor: c.surfaceAlt }]}>
                      <IconBadge name={f.icon} color={tones[f.tone]} background={c.surface} size={44} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="headline">{f.title}</Text>
                        <Text variant="caption" color="textTertiary">
                          {f.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={{ gap: spacing.xl }}>
                <Text variant="title1">어떻게 불러드릴까요?</Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="닉네임 (예: 점프하는 개발자)"
                  placeholderTextColor={c.textTertiary}
                  maxLength={16}
                  autoFocus
                  returnKeyType="done"
                  style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
                />
                <Text variant="title3" style={{ marginTop: spacing.md }}>
                  어떤 준비를 하고 있나요?
                </Text>
                <View style={{ gap: spacing.md }}>
                  <OptionCard
                    selected={goal === 'new'}
                    onPress={() => setGoal('new')}
                    icon="rocket-outline"
                    title="신입 취업 준비"
                    description="기본기 위주로, 쉬운 문제부터 차근차근"
                  />
                  <OptionCard
                    selected={goal === 'career'}
                    onPress={() => setGoal('career')}
                    icon="trending-up-outline"
                    title="경력 이직 준비"
                    description="실무 심화·설계 질문과 중급 이상 문제 위주로"
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={{ gap: spacing.xl }}>
                <View style={{ gap: spacing.sm }}>
                  <Text variant="title1">코딩 테스트 언어를{'\n'}골라주세요</Text>
                  <Text variant="callout" color="textTertiary">
                    문제를 풀 때 기본 언어로 사용해요. 언제든 바꿀 수 있어요.
                  </Text>
                </View>
                <View style={{ gap: spacing.md }}>
                  {SOLVE_LANGUAGES.map((l) => (
                    <OptionCard
                      key={l.id}
                      selected={language === l.id}
                      onPress={() => setLanguage(l.id)}
                      title={l.label}
                      description={l.local ? `${LANGUAGE_DESC[l.id]} · 기기에서 바로 채점` : `${LANGUAGE_DESC[l.id]} · 채점은 실행 서버 연결 시`}
                      icon={LANGUAGE_ICON[l.id]}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={{ gap: spacing.xl }}>
                <View style={{ gap: spacing.sm }}>
                  <Text variant="title1">주로 쓰는 백엔드{'\n'}프레임워크는요?</Text>
                  <Text variant="callout" color="textTertiary">코드 리뷰 문제를 이 프레임워크 위주로 추천해드려요.</Text>
                </View>
                <View style={{ gap: spacing.md }}>
                  {REVIEW_FRAMEWORKS.map((f) => (
                    <OptionCard
                      key={f.id}
                      selected={framework === f.id}
                      onPress={() => setFramework(f.id)}
                      title={f.title}
                      description={f.subtitle}
                      icon={f.icon}
                      accent={f.accent}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={{ gap: spacing.xl }}>
                <View style={{ gap: spacing.sm }}>
                  <Text variant="title1">하루 목표를{'\n'}정해볼까요?</Text>
                  <Text variant="callout" color="textTertiary">
                    퀴즈 한 문제, 카드 한 장, 코드 제출 한 번이 각각 1개로 기록돼요.
                  </Text>
                </View>
                <View style={{ gap: spacing.md }}>
                  {[
                    { v: 5, t: '가볍게', d: '하루 5개 · 약 5분' },
                    { v: 10, t: '꾸준히', d: '하루 10개 · 약 10분' },
                    { v: 20, t: '열심히', d: '하루 20개 · 약 20분' },
                    { v: 30, t: '집중 모드', d: '하루 30개 · 30분 이상' },
                  ].map((o) => (
                    <OptionCard key={o.v} selected={dailyGoal === o.v} onPress={() => setDailyGoal(o.v)} title={o.t} description={o.d} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title={step === 0 ? '시작하기' : step === STEPS ? '학습 시작하기' : '다음'}
            onPress={next}
            fullWidth
            disabled={step === 1 && nickname.trim().length === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 17 },
  footer: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: spacing.xxl, paddingBottom: spacing.md, paddingTop: spacing.sm },
});
