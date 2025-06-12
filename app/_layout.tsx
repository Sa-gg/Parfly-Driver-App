import { Stack } from 'expo-router';
import 'react-native-reanimated';



export default function RootLayout() {
  return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="loading" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="(tabs)" />
        </Stack>
  );
}
