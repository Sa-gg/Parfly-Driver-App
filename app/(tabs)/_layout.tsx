import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function AnimatedTabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, {
      stiffness: 200,
      damping: 20,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingTop: 5,
          paddingBottom: insets.bottom + 10,
          height: 60 + insets.bottom,
          backgroundColor: '#fff',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = 24;
          switch (route.name) {
            case 'current':
              return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatedTabIcon focused={focused}>
                    <MaterialCommunityIcons
                      name={focused ? 'road-variant' : 'road'}
                      size={iconSize}
                      color={color}
                    />
                  </AnimatedTabIcon>
                </View>
              );

            case 'map':
              return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatedTabIcon focused={focused}>
                    <MaterialCommunityIcons
                      name={focused ? 'map-marker-path' : 'map-marker-outline'}
                      size={iconSize}
                      color={color}
                    />
                  </AnimatedTabIcon>
                </View>
              );

            case 'orders':
              return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons
                    name={focused ? 'file-tray-full' : 'file-tray-outline'}
                    size={iconSize}
                    color={color}
                  />
                </View>
              );

            case 'chat':
              return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons
                    name={focused ? 'chatbubble' : 'chatbubble-outline'}
                    size={iconSize}
                    color={color}
                  />
                </View>
              );

            case 'menu':
              return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons
                    name={focused ? 'menu' : 'menu-outline'}
                    size={iconSize}
                    color={color}
                  />
                </View>
              );

            default:
              return (
                <Ionicons
                  name="ellipse"
                  size={iconSize}
                  color={color}
                />
              );
          }
        },
      })}
    >
      <Tabs.Screen name="current" options={{ title: 'Current' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
    </Tabs>
  );
}
