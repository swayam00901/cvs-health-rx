import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { EhrApi } from '../services/api';

type EhrRecord = {
  id: string;
  resourceType: string;
  code: string;
  display: string;
  value?: string;
  recordedAt: string;
};

const TABS = ['All', 'Observation', 'Condition', 'AllergyIntolerance'] as const;

export default function EhrScreen() {
  const patientId = useSelector((s: RootState) => s.session.patientId) ?? 'demo-patient';
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [items, setItems] = useState<EhrRecord[]>([]);

  useEffect(() => {
    EhrApi.records(patientId, tab === 'All' ? undefined : tab).then(setItems);
  }, [tab, patientId]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.display}</Text>
            <Text style={styles.rowMeta}>
              {item.resourceType} · {item.code}
              {item.value ? ` · ${item.value}` : ''}
            </Text>
            <Text style={styles.rowDate}>{new Date(item.recordedAt).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 8, gap: 6, backgroundColor: '#fafafa' },
  tab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee' },
  tabActive: { backgroundColor: '#CC0000' },
  tabText: { color: '#333', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  row: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  rowTitle: { fontWeight: '600' },
  rowMeta: { color: '#666', marginTop: 2, fontSize: 12 },
  rowDate: { color: '#999', marginTop: 2, fontSize: 11 },
});
