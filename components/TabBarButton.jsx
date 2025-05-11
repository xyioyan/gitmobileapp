import { View, Text, Pressable, StyleSheet } from 'react-native';
import React from 'react';
import { icons } from '../assets/icons';
import Animated, { 
  interpolate, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING } from '@/src/constants/theme';

const TabBarButton = (props) => {
  const { isFocused, label, routeName, onPress, onLongPress, showLabel } = props;
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      damping: 10,
      stiffness: 150
    });
    opacity.value = withSpring(isFocused ? 1 : 0.7, { duration: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.1]) }],
      opacity: opacity.value
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: showLabel && isFocused ? 1 : 0,
      transform: [{
        translateY: interpolate(
          scale.value,
          [0, 1],
          [5, 0]
        )
      }]
    };
  });

  return (
    <Pressable 
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
      android_ripple={{
        color: COLORS.primaryLight,
        borderless: true,
        radius: 28
      }}
    >
      <View style={styles.buttonContent}>
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          {icons[routeName]({
            color: isFocused ? COLORS.primary : COLORS.gray500,
            size: 26
          })}
        </Animated.View>

        {showLabel && (
          <Animated.Text style={[
            TYPOGRAPHY.caption,
            styles.label,
            { color: isFocused ? COLORS.primary : 'transparent' },
            animatedTextStyle
          ]}>
            {label}
          </Animated.Text>
        )}
      </View>

      {isFocused && <View style={styles.activeBar} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    position: 'relative',
  },
  buttonContent: {
    alignItems: 'center',
    gap: SPACING.tiny,
  },
  iconContainer: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '40%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});

export default TabBarButton;
