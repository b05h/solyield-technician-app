import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { getAllInspections } from '../db/actions';
import Inspection from '../db/models/Inspection';

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

export default function LocalReportsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<LocalReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getAllInspections();
      setItems(records.map(inspectionToItem));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handlePress = useCallback(
    (visitId: string) => {
      router.push(`/visit/${visitId}`);
    },
    [router]
  );

  const renderItem: ListRenderItem<LocalReportItem> = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.card}
        onPress={() => handlePress(item.visitId)}
        android_ripple={{ color: '#e2e8f0' }}
      >
        <Text style={styles.siteId}>{item.siteId}</Text>
        <Text style={styles.visitId}>Visit: {item.visitId}</Text>
        <View style={styles.syncRow}>
          <View style={[styles.syncDot, item.isSynced ? styles.syncDotSynced : styles.syncDotPending]} />
          <Text style={styles.syncLabel}>{item.isSynced ? 'Synced' : 'Waiting to Sync'}</Text>
        </View>
      </Pressable>
    ),
    [handlePress]
  );

  const keyExtractor = useCallback((item: LocalReportItem) => item.id, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading local reports…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLabel}>← Back</Text>
      </Pressable>
      <Text style={styles.header}>Local Drafts</Text>
      <Text style={styles.subheader}>Tap a report to resume or view.</Text>
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No local inspections yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
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
  backRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
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
  siteId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  visitId: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  syncDotPending: {
    backgroundColor: '#facc15',
  },
  syncDotSynced: {
    backgroundColor: '#22c55e',
  },
  syncLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
});
