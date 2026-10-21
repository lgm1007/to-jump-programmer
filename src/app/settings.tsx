import Constants from 'expo-constants';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { InstallAppCard } from '@/components/install-app-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, Divider, SectionHeader } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { CONTENT_STATS, DEV_TRACKS, type BackendFrameworkId, type FrontendFrameworkId } from '@/content';
import { openAdPrivacyOptions, useAds } from '@/features/ads';
import { backupFileName, createBackup, describeBackup, parseBackup } from '@/features/progress/backup';
import { BACKUP_SUPPORTED, pickBackupFile, saveBackupFile } from '@/features/progress/backup-file';
import { reviewFrameworksFor, solveLanguagesFor } from '@/features/progress/course';
import { useProgress, type ThemePreference } from '@/features/progress/store';
import { confirmAsync, notify } from '@/lib/confirm';
import { GITHUB_URL, openExternal } from '@/lib/links';
import { LANGUAGE_LABEL } from '@/lib/highlight';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const c = useColors();
  const profile = useProgress((s) => s.profile);
  const settings = useProgress((s) => s.settings);
  const updateProfile = useProgress((s) => s.updateProfile);
  const updateSettings = useProgress((s) => s.updateSettings);
  const resetProgress = useProgress((s) => s.resetProgress);
  const restoreProgress = useProgress((s) => s.restoreProgress);
  const adPrivacyRequired = useAds((s) => s.privacyOptionsRequired);
  const [nickname, setNickname] = useState(profile.nickname);

  const reset = async () => {
    const ok = await confirmAsync('학습 기록 초기화', '퀴즈 · 알고리즘 유형 · 코드 리뷰 · 카드 학습 기록과 북마크가 모두 삭제돼요. 프로필과 설정은 유지돼요.', '초기화', true);
    if (!ok) return;
    resetProgress();
    notify('초기화 완료', '학습 기록을 초기화했어요.');
  };

  const exportBackup = async () => {
    const fileName = backupFileName();
    const text = JSON.stringify(createBackup(useProgress.getState()));
    const result = await saveBackupFile(text, fileName);
    if (result === 'downloaded') notify('백업 완료', `${fileName} 파일을 내려받았어요. Google Drive 같은 안전한 곳에 보관하세요.`);
  };

  const importBackup = async () => {
    const text = await pickBackupFile();
    if (text == null) return;
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      notify('복원할 수 없어요', parsed.error);
      return;
    }
    const { backup } = parsed;
    const ok = await confirmAsync(
      '학습 기록 복원',
      `${describeBackup(backup)}\n\n지금 이 기기의 학습 기록과 설정을 백업 내용으로 바꿔요.`,
      '복원',
      true,
    );
    if (!ok) return;
    restoreProgress(backup.progress);
    setNickname(useProgress.getState().profile.nickname);
    notify('복원 완료', '학습 기록을 복원했어요.');
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
        <Field label="개발자 코스">
          <SegmentedControl
            value={profile.track}
            onChange={(track) => updateProfile({ track })}
            options={DEV_TRACKS.map((t) => ({ value: t.id, label: t.title }))}
          />
        </Field>
        <Field label="코딩 테스트 기본 언어">
          <View style={styles.chips}>
            {solveLanguagesFor(profile.track).map((l) => (
              <Chip key={l} label={LANGUAGE_LABEL[l]} selected={profile.language === l} onPress={() => updateProfile({ language: l })} />
            ))}
          </View>
        </Field>
        {profile.track !== 'frontend' && (
          <Field label="백엔드 프레임워크">
            <View style={styles.chips}>
              {reviewFrameworksFor('backend').map((f) => (
                <Chip
                  key={f.id}
                  label={f.title}
                  selected={profile.framework === f.id}
                  onPress={() => updateProfile({ framework: f.id as BackendFrameworkId })}
                />
              ))}
            </View>
          </Field>
        )}
        {profile.track !== 'backend' && (
          <Field label="프론트엔드 프레임워크">
            <View style={styles.chips}>
              {reviewFrameworksFor('frontend').map((f) => (
                <Chip
                  key={f.id}
                  label={f.title}
                  selected={profile.frontendFramework === f.id}
                  onPress={() => updateProfile({ frontendFramework: f.id as FrontendFrameworkId })}
                />
              ))}
            </View>
          </Field>
        )}
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
        <View style={styles.switchRow}>
          <Text variant="body" style={{ flex: 1 }}>
            진동 피드백
          </Text>
          <Switch value={settings.haptics} onValueChange={(haptics) => updateSettings({ haptics })} />
        </View>
      </Card>

      {Platform.OS === 'web' && (
        <>
          <SectionHeader title="앱 설치" />
          <InstallAppCard />
        </>
      )}

      <SectionHeader title="데이터" />
      <Card style={{ gap: spacing.md }}>
        <Text variant="caption" color="textSecondary">
          {Platform.OS === 'web'
            ? '모든 학습 기록은 이 브라우저에만 저장되고 외부로 전송되지 않아요. 브라우저 데이터를 지우면 함께 지워지니 가끔 백업해 두세요.'
            : '모든 학습 기록은 이 기기에만 저장되고 외부로 전송되지 않아요.'}
        </Text>
        {BACKUP_SUPPORTED && (
          <View style={styles.backupRow}>
            <Button title="백업 내보내기" icon="cloud-upload-outline" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => void exportBackup()} />
            <Button title="백업 복원" icon="cloud-download-outline" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => void importBackup()} />
          </View>
        )}
        <Button title="학습 기록 초기화" variant="danger" size="md" onPress={reset} />
      </Card>

      <SectionHeader title="앱 정보" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <InfoRow label="버전" value={Constants.expoConfig?.version ?? '1.0.0'} />
        <Divider />
        <InfoRow
          label="수록 콘텐츠"
          value={`CS 이론 ${CONTENT_STATS.lessons} · 퀴즈 ${CONTENT_STATS.algoQuestions + CONTENT_STATS.csQuestions} · 알고리즘 유형 ${CONTENT_STATS.algoPatterns} · 카드 ${CONTENT_STATS.cards} · 리뷰 ${CONTENT_STATS.patterns + CONTENT_STATS.challenges}`}
        />
        <Divider />
        <Pressable onPress={() => router.push('/about')} accessibilityRole="link">
          <InfoRow label="서비스 소개" value="보기 ›" />
        </Pressable>
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
        <Pressable onPress={() => openExternal(GITHUB_URL)} accessibilityRole="link" accessibilityLabel="GitHub 저장소 열기">
          <InfoRow label="GitHub" value="lgm1007/to-jump-programmer ›" />
        </Pressable>
        <Divider />
        <InfoRow label="오픈소스" value="Expo · React Native" />
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
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  backupRow: { flexDirection: 'row', gap: spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg },
});
