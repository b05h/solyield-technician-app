import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Visits',
          tabBarLabel: 'Agenda',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Site Map',
          tabBarLabel: 'Map',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 18,
  },
});
