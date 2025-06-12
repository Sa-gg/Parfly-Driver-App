// app/loading.tsx
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await SecureStore.getItemAsync('driverToken');
      setTimeout(() => {
        if (token) {
          router.replace('/current'); // or your actual home path
        } else {
          router.replace('/login');
        }
      }, 1500); // fake loading delay
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Parlfy Driver</Text>
      <ActivityIndicator size="large" color="#FF6600" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6600',
    marginBottom: 20,
  },
});
