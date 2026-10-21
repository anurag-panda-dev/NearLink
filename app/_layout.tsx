import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/theme/colors';
import { useIdentityStore } from '../src/stores/identityStore';

export default function RootLayout() {
  const initializeIdentity = useIdentityStore((s) => s.initialize);

  useEffect(() => {
    initializeIdentity();
  }, [initializeIdentity]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="nearby" />
        <Stack.Screen name="chats" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="groups" />
        <Stack.Screen name="group/create" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="mesh" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
