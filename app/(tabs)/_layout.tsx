import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Pressable, Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { useClientOnlyValue } from '@/src/components/useClientOnlyValue';
import { useCoffeeStore } from '@/src/stores/coffeeStore';
import { queryClient } from '@/src/config/queryClient';

function TabLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, logoutUser } = useCoffeeStore();

  const handleLogout = async () => {
    const performLogout = async () => {
      queryClient.clear();
      await logoutUser();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: isLoggedIn ? undefined : { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Students',
          tabBarIcon: ({ color }) => <FontAwesome name="group" size={24} color="black" />,
          headerRight: () =>
            isLoggedIn ? (
              <Pressable
                onPress={handleLogout}
                testID="header-logout-button"
                style={{ marginRight: 15 }}
              >
                {({ pressed }) => (
                  <FontAwesome
                    name="sign-out"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            ) : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (<FontAwesome name="history" size={24} color="black" />),
        }}
      />

    </Tabs>
  );
}
export default Sentry.wrap(TabLayout);
