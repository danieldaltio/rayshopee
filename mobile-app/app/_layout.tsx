import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTintColor: '#333',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="products/[id]"
          options={{ title: 'Editar Produto', presentation: 'modal' }}
        />
        <Stack.Screen
          name="scan"
          options={{ title: 'Escanear', presentation: 'fullScreenModal' }}
        />
      </Stack>
    </>
  );
}