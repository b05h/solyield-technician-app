import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { performSync } from '../services/SyncService';

export default function useNetworkSync(): void {
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const connected = state.isConnected ?? false;

      if (wasConnected.current === false && connected === true) {
        Alert.alert('Connection restored', 'Syncing your reports...');

        try {
          await performSync();
        } catch (error) {
          console.error('useNetworkSync: performSync failed', error);
        }
      }

      wasConnected.current = connected;
    });

    return unsubscribe;
  }, []);
}
