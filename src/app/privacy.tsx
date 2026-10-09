import { Stack } from 'expo-router';

import { RichText } from '@/components/rich-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { PRIVACY_POLICY } from '@/content/legal';

export default function PrivacyScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: '개인정보 처리방침' }} />
      <Card>
        <RichText text={PRIVACY_POLICY} variant="callout" />
      </Card>
    </Screen>
  );
}
