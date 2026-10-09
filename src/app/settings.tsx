import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, Divider, SectionHeader } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { CONTENT_STATS, REVIEW_FRAMEWORKS } from '@/content';
import { openAdPrivacyOptions, useAds } from '@/features/ads';
import { useProgress, type ThemePreference } from '@/features/progress/store';
import { SOLVE_LANGUAGES } from '@/features/runner/core/languages';
import { pingRemote } from '@/features/runner/remote';
import { confirmAsync, notify } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const c = useColors();
  const profile = useProgress((s) => s.profile);
  const settings = useProgress((s) => s.settings);
  const updateProfile = useProgress((s) => s.updateProfile);
  const updateSettings = useProgress((s) => s.updateSettings);
  const resetProgress = useProgress((s) => s.resetProgress);
  const adPrivacyRequired = useAds((s) => s.privacyOptionsRequired);
  const [nickname, setNickname] = useState(profile.nickname);
  const [runnerUrl, setRunnerUrl] = useState(settings.runnerUrl);
  const [ping, setPing] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false });

  const saveRunner = async () => {
    const url = runnerUrl.trim().replace(/\/+$/, '');
    if (url && !/^https?:\/\//.test(url)) {
      setPing({ loading: false, ok: false, message: 'http:// 또는 https:// 로 시작해야 해요.' });
      return;
    }
    updateSettings({ runnerUrl: url });
    setRunnerUrl(url);
    if (!url) {
      setPing({ loading: false, ok: undefined, message: '실행 서버 연결을 해제했어요.' });
      return;
    }
    setPing({ loading: true });
    const r = await pingRemote(url);
    setPing({ loading: false, ok: r.ok, message: r.message });
    haptic(r.ok ? 'success' : 'error');
  };

  const reset = async () => {
    const ok = await confirmAsync('학습 기록 초기화', '퀴즈 · 문제 · 카드 학습 기록과 북마크가 모두 삭제돼요. 프로필과 설정은 유지돼요.', '초기화', true);
    if (!ok) return;
    resetProgress();
    notify('초기화 완료', '학습 기록을 초기화했어요.');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: '설정' }} />

      <SectionHeader title="프로필" />
      <Card style={{ gap: spacing.lg }}>
        <Field label="닉네임">
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            onEndEditing={() => nickname.trim() && updateProfile({ nickname: nickname.trim() })}
            onBlur={() => nickname.trim() && updateProfile({ nickname: nickname.trim() })}
            maxLength={16}
            style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
        </Field>
        <Field label="준비 목표">
          <SegmentedControl
            value={profile.goal}
            onChange={(goal) => updateProfile({ goal })}
            options={[
              { value: 'new', label: '신입 취업' },
              { value: 'career', label: '경력 이직' },
            ]}
          />
        </Field>
        <Field label="코딩 테스트 기본 언어">
          <View style={styles.chips}>
            {SOLVE_LANGUAGES.map((l) => (
              <Chip key={l.id} label={l.label} selected={profile.language === l.id} onPress={() => updateProfile({ language: l.id })} />
            ))}
          </View>
        </Field>
        <Field label="관심 프레임워크">
          <View style={styles.chips}>
            {REVIEW_FRAMEWORKS.map((f) => (
              <Chip key={f.id} label={f.title} selected={profile.framework === f.id} onPress={() => updateProfile({ framework: f.id })} />
            ))}
          </View>
        </Field>
        <Field label="하루 목표">
          <View style={styles.chips}>
            {[5, 10, 20, 30].map((n) => (
              <Chip key={n} label={`${n}개`} selected={profile.dailyGoal === n} onPress={() => updateProfile({ dailyGoal: n })} />
            ))}
          </View>
        </Field>
      </Card>

      <SectionHeader title="화면" />
      <Card style={{ gap: spacing.lg }}>
        <Field label="테마">
          <SegmentedControl<ThemePreference>
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: '시스템' },
              { value: 'light', label: '라이트' },
              { value: 'dark', label: '다크' },
            ]}
          />
        </Field>
        <Field label={`코드 에디터 글자 크기 · ${settings.editorFontSize}`}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => updateSettings({ editorFontSize: Math.max(11, settings.editorFontSize - 1) })}
              style={[styles.stepBtn, { backgroundColor: c.surfaceAlt }]}
              accessibilityLabel="글자 작게">
              <Ionicons name="remove" size={20} color={c.text} />
            </Pressable>
            <Text variant="bodyStrong" style={{ minWidth: 36, textAlign: 'center' }}>
              {settings.editorFontSize}
            </Text>
            <Pressable
              onPress={() => updateSettings({ editorFontSize: Math.min(20, settings.editorFontSize + 1) })}
              style={[styles.stepBtn, { backgroundColor: c.surfaceAlt }]}
              accessibilityLabel="글자 크게">
              <Ionicons name="add" size={20} color={c.text} />
            </Pressable>
          </View>
        </Field>
        <View style={styles.switchRow}>
          <Text variant="body" style={{ flex: 1 }}>
            진동 피드백
          </Text>
          <Switch value={settings.haptics} onValueChange={(haptics) => updateSettings({ haptics })} />
        </View>
      </Card>

      <SectionHeader title="코드 실행 서버" subtitle="Java · Kotlin · C++ 채점용 (Python · JavaScript 는 기기에서 실행)" />
      <Card style={{ gap: spacing.md }}>
        <Text variant="caption" color="textSecondary">
          오픈소스 코드 실행 엔진 Piston 서버 주소를 입력하세요. 저장소의 infra/runner 폴더에 무료 클라우드에 직접 띄우는 방법이 있어요.
        </Text>
        <TextInput
          value={runnerUrl}
          onChangeText={setRunnerUrl}
          placeholder="https://runner.example.com"
          placeholderTextColor={c.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
        />
        <Button title="저장하고 연결 확인" size="md" variant="secondary" loading={ping.loading} onPress={saveRunner} />
        {!!ping.message && (
          <View style={styles.pingRow}>
            <Ionicons
              name={ping.ok === undefined ? 'information-circle' : ping.ok ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={ping.ok === undefined ? c.textTertiary : ping.ok ? c.success : c.danger}
            />
            <Text variant="caption" tint={ping.ok === undefined ? c.textTertiary : ping.ok ? c.success : c.danger} style={{ flex: 1 }}>
              {ping.message}
            </Text>
          </View>
        )}
      </Card>

      <SectionHeader title="데이터" />
      <Card style={{ gap: spacing.md }}>
        <Text variant="caption" color="textSecondary">
          모든 학습 기록은 이 기기에만 저장되고 외부로 전송되지 않아요.
        </Text>
        <Button title="학습 기록 초기화" variant="danger" size="md" onPress={reset} />
      </Card>

      <SectionHeader title="앱 정보" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <InfoRow label="버전" value={Constants.expoConfig?.version ?? '1.0.0'} />
        <Divider />
        <InfoRow
          label="수록 콘텐츠"
          value={`퀴즈 ${CONTENT_STATS.algoQuestions + CONTENT_STATS.csQuestions} · 문제 ${CONTENT_STATS.problems} · 카드 ${CONTENT_STATS.cards} · 리뷰 ${CONTENT_STATS.patterns + CONTENT_STATS.challenges}`}
        />
        <Divider />
        <Pressable onPress={() => router.push('/privacy')} accessibilityRole="link">
          <InfoRow label="개인정보 처리방침" value="보기 ›" />
        </Pressable>
        {adPrivacyRequired && (
          <>
            <Divider />
            <Pressable onPress={() => void openAdPrivacyOptions().catch(() => {})} accessibilityRole="button">
              <InfoRow label="광고 개인정보 설정" value="변경 ›" />
            </Pressable>
          </>
        )}
        <Divider />
        <InfoRow label="오픈소스" value="Expo · CodeMirror · Pyodide" />
      </Card>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="captionStrong" color="textTertiary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="body">{label}</Text>
      <Text variant="caption" color="textTertiary" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg },
});
