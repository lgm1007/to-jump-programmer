import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** 눌렀을 때 축소 비율 */
  scaleTo?: number;
}

/** 눌렀을 때 살짝 작아지는 터치 영역 (토스 스타일의 촉각 피드백) */
export function PressableScale({ style, scaleTo = 0.98, disabled, ...rest }: PressableScaleProps) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && { transform: [{ scale: scaleTo }], opacity: 0.92 },
      ]}
      {...rest}
    />
  );
}
