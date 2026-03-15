import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'index') {
            iconName = 'calendar-outline';
          } else if (route.name === 'map') {
            iconName = 'map-outline';
          } else if (route.name === 'local-reports') {
            iconName = 'file-tray-full-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
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
      <Tabs.Screen
        name="local-reports"
        options={{
          title: 'Local Drafts',
          tabBarLabel: 'Offline',
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
