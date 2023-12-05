import React, {useMemo} from 'react';
import {Dimensions, View} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  clamp,
} from '@shopify/react-native-skia';

import {snapPoint} from './math';
import {
  transition,
  cube,
  pageCurl,
  glitchMemories,
  swirl,
  swap,
  linear,
  waterDrops,
} from './transitions/index';
import {useAssets} from './Assets';

const {width, height} = Dimensions.get('window');
const transitions = [
  cube,
  pageCurl,
  glitchMemories,
  swirl,
  swap,
  linear,
  waterDrops,
].map(t => transition(t));

/*
 // Example usage:
const arr = [1, 2, 3, 4, 5];
console.log(getElementAtIndex(arr, 7)); // Output: 3
console.log(getElementAtIndex(arr, -2)); // Output: 4
*/
const at = <T,>(array: T[], index: number) => {
  'worklet';
  if (array === null) {
    return null;
  }
  if (array.length === 0) {
    throw new Error('Array is empty.');
  }
  return array[((index % array.length) + array.length) % array.length];
};

const App = () => {
  const offset = useSharedValue(0);
  const progressLeft = useSharedValue(0);
  const progressRight = useSharedValue(0);
  const assets = useAssets();
  const panLeft = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(-5)
        .onChange(pos => {
          progressLeft.value = clamp(
            progressLeft.value - pos.changeX / width,
            0,
            1,
          );
        })
        .onEnd(({velocityX}) => {
          const dst = snapPoint(progressLeft.value, -velocityX / width, [0, 1]);
          progressLeft.value = withTiming(dst, {duration: 250}, () => {
            offset.value += 1;
            progressLeft.value = 0;
          });
        }),
    [progressLeft, offset],
  );
  const panRight = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(5)
        .onChange(pos => {
          progressRight.value = clamp(
            progressRight.value + pos.changeX / width,
            0,
            1,
          );
        })
        .onEnd(({velocityX}) => {
          const dst = snapPoint(progressRight.value, velocityX / width, [0, 1]);
          progressRight.value = withTiming(dst, {duration: 250}, () => {
            offset.value -= 1;
            progressRight.value = 0;
          });
        }),
    [progressRight, offset],
  );
  const uniformsLeft = useDerivedValue(() => {
    return {
      progress: progressLeft.value,
      resolution: [width, height],
    };
  });
  const uniformsRight = useDerivedValue(() => {
    return {
      progress: progressRight.value,
      resolution: [width, height],
    };
  });
  const transition1 = useDerivedValue(() => {
    return at(transitions, offset.value - 1);
  });
  const transition2 = useDerivedValue(() => {
    return at(transitions, offset.value);
  });
  const assest1 = useDerivedValue(() => {
    return at(assets!, offset.value - 1);
  });
  const assest2 = useDerivedValue(() => {
    return at(assets!, offset.value);
  });
  const assest3 = useDerivedValue(() => {
    return at(assets!, offset.value + 1);
  });
  if (!assets) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <GestureDetector gesture={Gesture.Race(panLeft, panRight)}>
        <Canvas style={{flex: 1}}>
          <Fill>
            <Shader source={transition1} uniforms={uniformsRight}>
              <Shader source={transition2} uniforms={uniformsLeft}>
                <ImageShader
                  image={assest2}
                  fit="cover"
                  width={width}
                  height={height}
                />
                <ImageShader
                  image={assest3}
                  fit="cover"
                  width={width}
                  height={height}
                />
              </Shader>
              <ImageShader
                image={assest1}
                fit="cover"
                width={width}
                height={height}
              />
            </Shader>
          </Fill>
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default App;
