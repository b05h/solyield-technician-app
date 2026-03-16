import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

import type { RootState } from '../../src/store';
import type { Visit } from '../../src/types/models';
import { selectVisitsForTechnician } from '../../src/store/selectors';
import { setVisitEventIds } from '../../src/store/slices/visitsSlice';
import { getAllInspections } from '../../src/db/actions';
import {
  requestCalendarAndRemindersPermissions,
  syncAllVisits,
} from '../../src/utils/calendar';

function useAgendaVisitsWithSites(): { visit: Visit; siteName: string; siteAddress: string }[] {
  const visits = useSelector(selectVisitsForTechnician);
  const sites = useSelector((s: RootState) => s.sites.items);

  return useMemo(() => {
    const siteById = new Map(sites.map((site) => [site.id, site]));
    return visits.map((visit) => {
      const site = siteById.get(visit.siteId);
      const address = site?.address
        ? site.address
        : site
        ? `${site.location.lat.toFixed(2)}, ${site.location.lng.toFixed(2)}`
        : 'Address unknown';
      return {
        visit,
        siteName: site?.name ?? 'Unknown site',
        siteAddress: address,
      };
    });
  }, [visits, sites]);
}

export default function MyVisitsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const items = useAgendaVisitsWithSites();
  
  const [inspectedVisitIds, setInspectedVisitIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });

    let isActive = true;
    (async () => {
      try {
        const inspections = await getAllInspections();
        if (isActive) {
          setInspectedVisitIds(new Set(inspections.map((rec) => rec.visitId)));
        }
      } catch (error) {
        console.error('Failed to load inspections', error);
      }
    })();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [items.length]);

  const finishedVisits = useMemo(() => {
    return items.filter(
      (item) =>
        item.visit.status === 'completed' || inspectedVisitIds.has(item.visit.id),
    );
  }, [items, inspectedVisitIds]);

  const pendingCount = useMemo(
    () => items.length - finishedVisits.length,
    [items.length, finishedVisits.length],
  );
  const finishedCount = finishedVisits.length;

  const todayString = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const handleSyncToDevice = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await requestCalendarAndRemindersPermissions();
      if (!granted) {
        Alert.alert('Calendar access denied', "Enable access in settings to sync.");
        return;
      }
      const map = await syncAllVisits(items.map((i) => i.visit), []);
      dispatch(setVisitEventIds(map));
      Alert.alert('Calendar synced', 'Visits have been synced to your calendar.');
    } catch (err) {
      Alert.alert('Sync failed', err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }, [dispatch, items]);

  const renderItem: ListRenderItem<{ visit: Visit; siteName: string; siteAddress: string }> = ({ item }) => {
    const isCompleted = item.visit.status === 'completed' || inspectedVisitIds.has(item.visit.id);
    
    return (
      <Pressable
        style={styles.visitCardContainer}
        onPress={() => router.push(`/visit/${item.visit.id}`)}
        android_ripple={{ color: '#e2e8f0' }}
      >
        <View style={[styles.statusStrip, { backgroundColor: isCompleted ? '#16a34a' : '#2563eb' }]} />
        <View style={styles.visitCardContent}>
          <View style={styles.visitCardHeader}>
            <Text style={styles.visitSiteName}>{item.siteName}</Text>
            {isCompleted && <MaterialCommunityIcons name="check-circle" size={18} color="#16a34a" />}
          </View>
          <View style={styles.rowInfo}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#1e293b" />
            <Text style={styles.rowText}>{item.siteAddress}</Text>
          </View>
          <View style={styles.rowInfo}>
            <MaterialCommunityIcons name="calendar-month" size={14} color="#1e293b" />
            <Text style={styles.rowText}>{`${item.visit.date} · ${item.visit.time}`}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Greeting on Left and Status on Right */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hello, Arjun</Text>
          <Text style={styles.dateText}>{todayString}</Text>
        </View>
        
        {/* Status Indicator on the Right */}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: isOnline ? "#22c55e" : "#f97316" }]}>
            {isOnline ? "Online" : "Offline"}
          </Text>
          <MaterialCommunityIcons 
            name={isOnline ? "cloud-check" : "cloud-off-outline"} 
            size={22} 
            color={isOnline ? "#22c55e" : "#f97316"} 
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{pendingCount}</Text>
        </View>
        <View style={[styles.statCard, styles.finishedCard]}>
          <Text style={styles.statLabel}>Finished</Text>
          <Text style={styles.statValue}>{finishedCount}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.syncCard, loading && styles.disabled]}
        onPress={handleSyncToDevice}
        disabled={loading}
      >
        <MaterialCommunityIcons name="calendar-sync" size={20} color="#fff" style={styles.syncIcon} />
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.syncCardText}>Sync to Calendar</Text>}
      </Pressable>

      <FlatList
        data={items}
        keyExtractor={(item) => item.visit.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.emptyWrapper}><Text style={styles.emptyText}>No visits scheduled</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  greeting: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  dateText: { marginTop: 2, fontSize: 14, color: '#64748b', fontWeight: '500' },
  
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '700', 
    marginRight: 6,
    textTransform: 'uppercase'
  },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, minHeight: 90, justifyContent: 'center', backgroundColor: '#fff', elevation: 2 },
  pendingCard: { borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  finishedCard: { borderLeftWidth: 4, borderLeftColor: '#16a34a' },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { marginTop: 4, fontSize: 28, color: '#0f172a', fontWeight: '800' },

  syncCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, padding: 14, minHeight: 52, marginBottom: 20, justifyContent: 'center' },
  syncIcon: { marginRight: 10 },
  syncCardText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },

  listContent: { paddingBottom: 30 },
  visitCardContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, minHeight: 88, overflow: 'hidden', elevation: 1, paddingRight: 12 },
  statusStrip: { width: 6, height: '100%', marginRight: 12 },
  visitCardContent: { flex: 1, paddingVertical: 12 },
  visitCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  visitSiteName: { fontSize: 17, color: '#0f172a', fontWeight: '800', flex: 1 },
  rowInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rowText: { marginLeft: 6, fontSize: 14, color: '#475569', flexShrink: 1 },
  emptyWrapper: { marginTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600' },
});