import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { AdBanner, startAds } from '@/features/ads';
import { useProgress } from '@/features/progress/store';
import { haptic } from '@/lib/haptics';
import { useColors } from '@/theme/theme-provider';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: '홈', icon: 'home-outline', iconActive: 'home' },
  { name: 'algorithm', title: '알고리즘', icon: 'code-slash-outline', iconActive: 'code-slash' },
  { name: 'review', title: '코드 리뷰', icon: 'git-pull-request-outline', iconActive: 'git-pull-request' },
  { name: 'interview', title: '면접 CS', icon: 'school-outline', iconActive: 'school' },
  { name: 'me', title: '마이', icon: 'person-outline', iconActive: 'person' },
];

/** 탭 바 바로 위에 하단 배너 광고를 둔다 (탭을 옮겨도 같은 배너가 유지된다) */
function TabBarWithBanner(props: BottomTabBarProps) {
  return (
    <View>
      <AdBanner />
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabLayout() {
  const c = useColors();
  const onboarded = useProgress((s) => s.profile.onboarded);

  // 온보딩을 마치고 메인 화면에 들어온 뒤에 광고를 준비한다 (첫 화면부터 권한 팝업이 뜨지 않게)
  useEffect(() => {
    if (onboarded) startAds();
  }, [onboarded]);

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBarWithBanner {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textTertiary,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          // 웹에는 하단 안전 영역이 없어 라벨이 바닥에 붙지 않도록 여백을 준다
          ...(Platform.OS === 'web' ? { height: 66, paddingTop: 6, paddingBottom: 10 } : null),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: c.bg },
      }}
      screenListeners={{ tabPress: () => haptic('selection') }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarAccessibilityLabel: t.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? t.iconActive : t.icon} size={23} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
