import { View, StyleSheet, Platform } from 'react-native';
import React from 'react';
import TabBarButton from './TabBarButton';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { COLORS, SPACING, SHADOWS } from '@/src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HIDDEN_ROUTES = ['Camera', 'WriteDescription'];

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const collapsed = useSharedValue(0);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: collapsed.value * 100 }],
    opacity: 1 - collapsed.value,
  }));

  const currentRouteName = state.routes[state.index].name;

  if (HIDDEN_ROUTES.includes(currentRouteName)) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container,
      animatedTabBarStyle,
      { paddingBottom: insets.bottom }
    ]}>
      <View style={styles.tabbar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;

          if (['_sitemap', '+not-found'].includes(route.name)) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarButton
              key={route.name}
              onPress={onPress}
              onLongPress={onLongPress}
              isFocused={isFocused}
              routeName={route.name}
              color={isFocused ? COLORS.primary : COLORS.gray500}
              label={label}
              showLabel={isFocused} // Only show label for active tab
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
  },
  tabbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
  },
});

export default TabBar;