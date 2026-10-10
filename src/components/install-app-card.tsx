import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/misc';
import { Text } from '@/components/ui/text';
import { dismissInstallCard, isInstallCardDismissed, usePwaInstall, type InstallHint } from '@/features/pwa/install';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

const GUIDE: Record<Exclude<InstallHint, 'unsupported'>, string> = {
  installed: '홈 화면에 설치한 앱으로 사용하고 있어요.',
  prompt: '홈 화면에 앱으로 설치하면 주소창 없이 전체 화면으로 쓰고, 인터넷이 없어도 열 수 있어요.',
  ios: '아래쪽(또는 주소창 옆)의 공유 버튼을 누른 뒤 [홈 화면에 추가]를 고르면 앱처럼 설치돼요. 설치한 앱은 Safari 와 저장 공간이 따로라서, 지금까지의 학습 기록은 [마이 › 설정 › 백업]으로 옮길 수 있어요.',
  'in-app': '카카오톡 같은 앱 안의 브라우저에서는 설치할 수 없어요. 메뉴에서 [다른 브라우저로 열기] 또는 [Safari 로 열기]를 눌러 Chrome · Safari 에서 열어주세요.',
  manual: '브라우저 메뉴에서 [앱 설치] 또는 [홈 화면에 추가]를 누르면 앱처럼 설치할 수 있어요.',
};

/**
 * 웹에서 홈 화면 설치(PWA)를 안내한다. 앱(iOS · Android)에서는 그리지 않는다.
 * dismissible: 홈 화면처럼 닫을 수 있는 안내 (닫으면 다시 보이지 않고, 설치한 뒤에도 보이지 않는다)
 */
export function InstallAppCard({ dismissible = false }: { dismissible?: boolean }) {
  const c = useColors();
  const { hint, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => dismissible && isInstallCardDismissed());

  if (hint === 'unsupported' || dismissed || (dismissible && hint === 'installed')) return null;
  const done = hint === 'installed';

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <IconBadge
          name={done ? 'checkmark-circle' : 'download-outline'}
          color={done ? c.success : c.primary}
          background={done ? c.successSoft : c.primarySoft}
        />
        <View style={styles.body}>
          <Text variant="bodyStrong">{done ? '앱으로 사용 중' : '앱으로 설치하기'}</Text>
          <Text variant="caption" color="textSecondary">
            {GUIDE[hint]}
          </Text>
        </View>
        {dismissible && (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="설치 안내 닫기"
            onPress={() => {
              dismissInstallCard();
              setDismissed(true);
            }}>
            <Ionicons name="close" size={20} color={c.textTertiary} />
          </Pressable>
        )}
      </View>
      {hint === 'prompt' && <Button title="앱 설치" icon="download-outline" size="md" onPress={() => void install()} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  body: { flex: 1, gap: 4 },
});
