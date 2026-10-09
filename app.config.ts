import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * 동적 앱 설정 — 고정 값은 app.json 에 두고, AdMob 설정만 환경 변수로 덧붙인다.
 * 실제 AdMob ID 는 저장소에 올리지 않는다.
 *   - 로컬 개발: .env.local (.gitignore 대상, .env.example 참고)
 *   - EAS Build: EAS 환경 변수 (docs/RELEASE.md 참고)
 * 값이 없으면 Google 공식 샘플 앱 ID 와 테스트 광고로 동작한다.
 */

/** Google 이 공개한 테스트용 샘플 앱 ID */
const SAMPLE_APP_ID = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

/** iOS 광고 전환 측정용 SKAdNetwork ID — https://developers.google.com/admob/ios/3p-skadnetworks (주기적으로 갱신) */
const SKADNETWORK_IDS = [
  'cstr6suwn9', '4fzdc2evr5', '2fnua5tdw4', 'ydx93a7ass', 'p78axxw29g', 'v72qych5uu', 'ludvb6z3bs',
  'cp8zw746q7', '3sh42y64q3', 'c6k4g5qg8m', 's39g8k73mm', 'wg4vff78zm', '3qy4746246', 'f38h382jlk',
  'hs6bdukanm', 'mlmmfzh3r3', 'v4nxqhlyqp', 'wzmmz9fp6w', 'su67r6k2v3', 'yclnxrl5pm', 't38b2kh725',
  '7ug5zh24hu', 'gta9lk7p23', 'vutu7akeur', 'y5ghdn5j9k', 'v9wttpbfk9', 'n38lu8286q', '47vhws6wlr',
  'kbd757ywx3', '9t245vhmpl', 'a2p9lx4jpn', '22mmun2rn5', '44jx6755aq', 'k674qkevps', '4468km3ulz',
  '2u9pt9hc89', '8s468mfl3y', 'klf5c3l5u5', 'ppxm28t8ap', 'kbmxgpxpgc', 'uw77j35x4d', '578prtvx9j',
  '4dzt52r2t5', 'tl55sbb4fm', 'c3frkrj4fj', 'e5fvkxwrpn', '8c4e2ghe7u', '3rd42ekr43', '97r2b46745',
  '3qcr597p9d',
].map((id) => `${id}.skadnetwork`);

type Os = 'android' | 'ios';
const OS_LIST: Os[] = ['android', 'ios'];

/** ADMOB_* 환경 변수를 읽는다. 앱 ID(~)와 광고 단위 ID(/)를 바꿔 넣으면 앱이 시작하자마자 죽으므로 형식을 검사한다. */
function readAdmobId(name: string, kind: 'app' | 'unit'): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  const pattern = kind === 'app' ? /^ca-app-pub-\d+~\d+$/ : /^ca-app-pub-\d+\/\d+$/;
  if (!pattern.test(value)) {
    throw new Error(
      `${name} 값의 형식이 올바르지 않습니다. ${kind === 'app' ? '앱 ID 는 ca-app-pub-…~… 형태' : '광고 단위 ID 는 ca-app-pub-…/… 형태'}입니다.`,
    );
  }
  return value;
}

function readPerOs(kind: 'app' | 'unit', key: string): Partial<Record<Os, string>> {
  const out: Partial<Record<Os, string>> = {};
  for (const os of OS_LIST) out[os] = readAdmobId(`ADMOB_${os.toUpperCase()}_${key}`, kind);
  return out;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appId = readPerOs('app', 'APP_ID');
  const adUnits = { banner: readPerOs('unit', 'BANNER_ID'), interstitial: readPerOs('unit', 'INTERSTITIAL_ID') };

  // 스토어 출시 빌드에 테스트 광고가 실리지 않도록 막는다 (EAS Build 서버에서만 설정되는 변수)
  const buildOs = process.env.EAS_BUILD_PLATFORM as Os | undefined;
  if (process.env.EAS_BUILD_PROFILE === 'production' && buildOs) {
    const missing = [
      !appId[buildOs] && 'APP_ID',
      !adUnits.banner[buildOs] && 'BANNER_ID',
      !adUnits.interstitial[buildOs] && 'INTERSTITIAL_ID',
    ]
      .filter(Boolean)
      .map((k) => `ADMOB_${buildOs.toUpperCase()}_${k}`);
    if (missing.length) {
      throw new Error(
        `production 빌드에 필요한 AdMob 환경 변수가 없습니다: ${missing.join(', ')}\n` +
          'EAS 환경 변수(production)에 등록한 뒤 다시 빌드하세요. (docs/RELEASE.md 참고)',
      );
    }
  }

  return {
    ...config,
    name: config.name ?? 'To Jump',
    slug: config.slug ?? 'to-jump-programmer',
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-google-mobile-ads',
        {
          // 기본값(classic)이지만 명시해야 한다. 값이 없으면 라이브러리 build.gradle 이 app.json 의
          // react-native-google-mobile-ads 항목을 찾다가 오타 버그(googleAdsJson)로 Android 빌드가 실패한다. (v17.2.0)
          androidSdk: 'classic',
          androidAppId: appId.android ?? SAMPLE_APP_ID.android,
          iosAppId: appId.ios ?? SAMPLE_APP_ID.ios,
          // 동의 확인 전에는 광고 SDK 의 측정 데이터를 보내지 않는다
          delayAppMeasurementInit: true,
          skAdNetworkItems: SKADNETWORK_IDS,
        },
      ],
    ],
    extra: { ...config.extra, adUnits },
  };
};
