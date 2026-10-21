import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { RichText } from '@/components/rich-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { aboutText } from '@/content/about';
import { GITHUB_URL, openExternal } from '@/lib/links';
import { spacing } from '@/theme/tokens';

/** 서비스 소개 — 어떤 서비스인지 · 콘텐츠를 어떻게 만드는지 · 운영자와 문의처 */
export default function AboutScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: '서비스 소개' }} />
      <Card>
        <RichText text={aboutText()} variant="callout" />
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Button title="GitHub 저장소" icon="logo-github" variant="secondary" style={{ flex: 1 }} onPress={() => openExternal(GITHUB_URL)} />
        <Button title="개인정보 처리방침" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/privacy')} />
      </View>
    </Screen>
  );
}
