import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { linkProps } from '@/lib/links';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** 눌렀을 때 축소 비율 */
  scaleTo?: number;
  /**
   * 콘텐츠 화면 주소 — 웹에서는 크롤러가 따라갈 수 있는 `<a href>` 로 그린다 (lib/links.ts `linkProps`).
   * onPress 가 없으면 누를 때 이 주소로 이동하고, 있으면 onPress 가 이동을 맡는다
   */
  href?: string;
  /** href 로 이동할 때 지금 화면을 바꾼다 (이전 · 다음 레슨) */
  replace?: boolean;
}

/** 눌렀을 때 살짝 작아지는 터치 영역 (토스 스타일의 촉각 피드백) */
export function PressableScale({ style, scaleTo = 0.98, disabled, href, replace, onPress, ...rest }: PressableScaleProps) {
  const link = href != null ? linkProps(href, { replace, onPress: onPress ?? undefined }) : undefined;
  return (
    <Pressable
      disabled={disabled}
      onPress={link ? link.onPress : onPress}
      {...link?.webProps}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && { transform: [{ scale: scaleTo }], opacity: 0.92 },
      ]}
      {...rest}
    />
  );
}
