/**
 * iOS UIScene 생명주기 적용 (Expo config plugin)
 *
 * iOS 27 SDK(Xcode 27)로 빌드한 앱은 UIScene 기반 생명주기를 쓰지 않으면 실행 직후 종료된다.
 * ("UIScene life cycle is required for apps built with this SDK")
 * Expo SDK 57 템플릿에는 아직 반영되지 않아, SDK 58 템플릿과 같은 구성을 prebuild 때 덧붙인다.
 *   - AppDelegate: ExpoReactNativeFactoryProvider 채택, 창 생성·React Native 시작 코드 제거
 *   - SceneDelegate.swift: expo 패키지의 ExpoAppSceneDelegate 를 상속 (창 생성·이벤트 전달 담당)
 *   - Info.plist: UIApplicationSceneManifest
 * 템플릿에 이미 적용되어 있으면(SDK 58 이상) 아무것도 바꾸지 않는다. SDK 58 로 올린 뒤에는 이 플러그인을 지워도 된다.
 */
const fs = require('fs');
const path = require('path');
const { IOSConfig, withAppDelegate, withDangerousMod, withInfoPlist, withXcodeProject } = require('expo/config-plugins');

const SCENE_DELEGATE_SWIFT = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}
`;

const START_REACT_NATIVE_BLOCK =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneManifest(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest ??= {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });
}

function withSceneAwareAppDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    const { language, contents } = cfg.modResults;
    if (language !== 'swift' || contents.includes('ExpoReactNativeFactoryProvider')) return cfg;

    const next = contents
      .replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {')
      .replace(
        START_REACT_NATIVE_BLOCK,
        '\n    // 창 생성과 React Native 시작은 SceneDelegate(UIScene 생명주기)가 맡는다\n',
      );
    if (!next.includes('ExpoReactNativeFactoryProvider') || next.includes('window = UIWindow(frame:')) {
      throw new Error(
        '[with-ios-scene-lifecycle] AppDelegate.swift 형식이 예상과 달라 UIScene 생명주기를 적용하지 못했습니다. ' +
          'Expo SDK 를 올렸다면 템플릿에 이미 포함되었는지 확인하고 이 플러그인을 제거하세요.',
      );
    }
    cfg.modResults.contents = next;
    return cfg;
  });
}

function withSceneDelegateFile(config) {
  const written = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, cfg.modRequest.projectName, 'SceneDelegate.swift');
      if (!fs.existsSync(file)) fs.writeFileSync(file, SCENE_DELEGATE_SWIFT);
      return cfg;
    },
  ]);
  return withXcodeProject(written, (cfg) => {
    const groupName = cfg.modRequest.projectName;
    const filepath = `${groupName}/SceneDelegate.swift`;
    if (!cfg.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName, project: cfg.modResults });
    }
    return cfg;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return withSceneDelegateFile(withSceneAwareAppDelegate(withSceneManifest(config)));
};
