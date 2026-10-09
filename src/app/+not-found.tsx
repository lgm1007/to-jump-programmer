import { router, Stack } from 'expo-router';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { Screen } from '@/components/ui/screen';

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
      <EmptyState
        icon="compass-outline"
        title="페이지를 찾을 수 없어요"
        description="주소가 바뀌었거나 삭제된 콘텐츠예요."
        action={<Button title="홈으로" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
