// app/(tabs)/visits.tsx  (MyVisitsScreen)
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  ListRenderItem,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../src/store';
import type { Visit } from '../../src/types/models';
import { selectVisitsForTechnician } from '../../src/store/selectors';
import { setVisitEventIds } from '../../src/store/slices/visitsSlice';
import {
  requestCalendarAndRemindersPermissions,
  syncAllVisits,
} from '../../src/utils/calendar';

function useAgendaVisitsWithSites(): { visit: Visit; siteName: string }[] {
  const visits = useSelector(selectVisitsForTechnician);
  const sites = useSelector((s: RootState) => s.sites.items);

  return useMemo(() => {
    const siteById = new Map(sites.map((site) => [site.id, site]));
    return visits.map((visit) => ({
      visit,
      siteName: siteById.get(visit.siteId)?.name ?? 'Unknown site',
    }));
  }, [visits, sites]);
}

export default function MyVisitsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const items = useAgendaVisitsWithSites();
  const visits = useSelector(selectVisitsForTechnician);
  const sites = useSelector((s: RootState) => s.sites.items);
  const [loading, setLoading] = useState(false);

  const handleSyncToDevice = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await requestCalendarAndRemindersPermissions();
      if (!granted) {
        Alert.alert(
          'Calendar access denied',
          "Without calendar access, you won't be able to see your schedule on your phone. You can turn it on in your device settings to sync visits."
        );
        return;
      }

      const map = await syncAllVisits(visits, sites);
      dispatch(setVisitEventIds(map));

      Alert.alert('Calendar synced', 'Visits have been synced to your calendar.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      Alert.alert('Sync failed', message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, visits, sites]);

  const handlePress = (visitId: string) => {
    router.push(`/visit/${visitId}`);
  };

  const renderItem: ListRenderItem<{ visit: Visit; siteName: string }> = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() => handlePress(item.visit.id)}
      android_ripple={{ color: '#e2e8f0' }}
    >
      <Text style={styles.siteName}>{item.siteName}</Text>
      <Text style={styles.title}>{item.visit.title}</Text>
      <Text style={styles.scheduled}>
        {item.visit.date} · {item.visit.time}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Visits</Text>

      <Pressable
        style={[styles.syncButton, loading && styles.syncButtonDisabled]}
        onPress={handleSyncToDevice}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.syncButtonText}>Sync to Device</Text>
        )}
      </Pressable>

      {items.length === 0 ? (
        <Text style={styles.empty}>No visits assigned</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.visit.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 4,
  },
  scheduled: {
    fontSize: 14,
    color: '#64748b',
  },
});