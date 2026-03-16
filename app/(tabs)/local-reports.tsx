import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

import { getAllInspections } from '../../src/db/actions';
import Inspection from '../../src/db/models/Inspection';
import { performSync } from '../../src/services/SyncService';

interface LocalReportItem {
  id: string;
  visitId: string;
  siteId: string;
  isSynced: boolean;
}

function inspectionToItem(record: Inspection): LocalReportItem {
  return {
    id: record.id,
    visitId: record.visitId,
    siteId: record.siteId,
    isSynced: record.isSynced,
  };
}

export default function LocalReportsRoute() {
  const router = useRouter();
  const [items, setItems] = useState<LocalReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const translateY = useRef(new Animated.Value(100)).current;

  const triggerToast = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 3000);
  }, [translateY]);

  const loadInspections = useCallback(async () => {
    try {
      const records = await getAllInspections();
      setItems(records.map(inspectionToItem));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await performSync();
      const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(nowLabel);
      await loadInspections();
      triggerToast();
    } catch (syncError) {
      console.error('Sync failed', syncError);
    } finally {
      setIsSyncing(false);
    }
  }, [loadInspections, triggerToast, isOnline]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => setIsOnline(!!state.isConnected));
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInspections();
    }, [loadInspections])
  );

  const renderItem: ListRenderItem<LocalReportItem> = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/visit/${item.visitId}`)}
      android_ripple={{ color: '#e2e8f0' }}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.siteId}>{item.siteId}</Text>
        <Text style={styles.visitId}>Visit: {item.visitId.substring(0, 8)}</Text>
      </View>
      <View style={[styles.statusBadge, item.isSynced ? styles.badgeSynced : styles.badgePending]}>
        <MaterialCommunityIcons
          name={item.isSynced ? 'check-circle' : 'clock-outline'}
          size={14}
          color={item.isSynced ? '#16a34a' : '#ca8a04'}
        />
        <Text style={[styles.statusBadgeText, { color: item.isSynced ? '#16a34a' : '#ca8a04' }]}>
          {item.isSynced ? 'Synced' : 'Waiting'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={20}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#0f172a" />
          </Pressable>
          <View style={styles.onlinePill}>
            <Text style={[styles.onlineText, { color: isOnline ? '#22c55e' : '#f97316' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#22c55e' : '#f97316' }]} />
          </View>
        </View>
        <Text style={styles.title}>Local Drafts</Text>
      </View>

      <View style={styles.syncCard}>
        <View>
          <Text style={styles.syncTitle}>Database Sync</Text>
          <Text style={styles.syncSubtitle}>Last update: {lastSyncedAt ?? 'None today'}</Text>
        </View>
        <Pressable
          style={[styles.syncButton, (isSyncing || !isOnline) && styles.syncDisabled]}
          onPress={runSync}
          disabled={isSyncing || !isOnline}
        >
          {isSyncing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.syncButtonText}>Sync Now</Text>}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
        <View style={styles.toast}>
          <MaterialCommunityIcons name="cloud-check" size={20} color="#fff" />
          <Text style={styles.toastText}>Successfully synced at {lastSyncedAt}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  toastContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: { color: '#fff', fontWeight: '600', marginLeft: 10, fontSize: 14 },

  headerContainer: { paddingHorizontal: 20, paddingTop: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#0f172a', marginTop: 8 },

  onlinePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 6, borderRadius: 20, elevation: 1 },
  onlineText: { fontSize: 11, fontWeight: '800', marginRight: 6, textTransform: 'uppercase' },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },

  syncCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  syncTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  syncSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  syncButton: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  syncDisabled: { backgroundColor: '#cbd5e1' },
  syncButtonText: { color: '#fff', fontWeight: '700' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardInfo: { flex: 1 },
  siteId: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  visitId: { fontSize: 13, color: '#64748b', marginTop: 2 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  badgeSynced: { backgroundColor: '#f0fdf4' },
  badgePending: { backgroundColor: '#fff7ed' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
});