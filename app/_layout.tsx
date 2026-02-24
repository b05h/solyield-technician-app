import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { StyleSheet, View } from 'react-native';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="visit/[id]" />
          <Stack.Screen name="visit/report" />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
