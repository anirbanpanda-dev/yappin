// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#FFF' },
        header: () => (
          <SafeAreaView edges={['top']} style={styles.header}>
            <Text style={styles.headerTitle}>VibeCast</Text>
          </SafeAreaView>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: '/(tabs)/',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 20, marginBottom: -5 }}>
              {focused ? '🏠' : '🏠'}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 20, marginBottom: -5 }}>
              {focused ? '🕒' : '🕒'}
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6200EE',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});