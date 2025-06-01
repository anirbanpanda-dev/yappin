// app/_layout.tsx
import { Stack } from 'expo-router';
import { PlaybackProvider } from '../context/PlaybackContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Ensure gesture handler is initialized
import 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PlaybackProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="player" options={{ headerShown: false }} />
        </Stack>
      </PlaybackProvider>
    </GestureHandlerRootView>
  );
}