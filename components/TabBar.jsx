import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import TabBarButton from './TabBarButton';
import Animated, { useSharedValue, useAnimatedStyle, withTiming ,withDelay} from 'react-native-reanimated';
const HIDDEN_ROUTES = ['Camera','WriteDescription'];

const TabBar = ({ state, descriptors, navigation }) => {
  const primaryColor = '#0891b2';
  const greyColor = '#737373';

  // Collapsing logic
  const collapsed = useSharedValue(0); // 0 = visible, 1 = collapsed

  // useEffect(() => {
  //   // Collapse the tab bar if not on the first tab (you can customize this logic)
  //   collapsed.value = withDelay(
  //     300, // delay in ms
  //     withTiming(state.index ===0 ? 0 : 1, { duration: 300 })
  //   );
  // }, [state.index]);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: collapsed.value * 100 }],
    opacity: 1 - collapsed.value,
  }));

  const currentRouteName = state.routes[state.index].name;

  if (HIDDEN_ROUTES.includes(currentRouteName)) {
    return null; // 🚫 Completely hide the tab bar
  }

  return (
    <Animated.View style={[styles.tabbar, animatedTabBarStyle]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

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
            style={styles.tabbarItem}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? primaryColor : greyColor}
            label={label}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderCurve: 'continuous',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
  },
});

export default TabBar;
