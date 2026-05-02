import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

const TABS = [
  { name: 'index', label: 'Scanner', icon: '📷' },
  { name: 'buscar', label: 'Buscar', icon: '🔍' },
];

export default function TabLayout() {  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.label, tabBarIcon: () => null }}
        />
      ))}
    </Tabs>  );
}