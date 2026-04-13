import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { PrescriptionsApi } from '../services/api';

type Rx = {
  id: string;
  drugName: string;
  dosage: string;
  refillsRemaining: number;
  status: string;
  lastFilledAt: string;
};

export default function PrescriptionsScreen() {
  const patientId = useSelector((s: RootState) => s.session.patientId) ?? 'demo-patient';
  const [items, setItems] = useState<Rx[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await PrescriptionsApi.list(patientId));
    } catch (e: any) {
      Alert.alert('Could not load prescriptions', e?.message ?? 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const refill = async (rxId: string) => {
    try {
      await PrescriptionsApi.refill(patientId, rxId);
      load();
    } catch (e: any) {
      Alert.alert('Refill failed', e?.response?.data?.error ?? e?.message);
    }
  };

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      // Perf: FlatList virtualizes rows; windowSize tuned for long Rx lists.
      windowSize={7}
      initialNumToRender={10}
      removeClippedSubviews
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.drugName}</Text>
            <Text style={styles.meta}>{item.dosage} · {item.refillsRemaining} refills left</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
          <Pressable
            style={[styles.btn, item.refillsRemaining <= 0 && styles.btnDisabled]}
            disabled={item.refillsRemaining <= 0}
            onPress={() => refill(item.id)}>
            <Text style={styles.btnText}>Refill</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10 },
  name: { fontWeight: '600', fontSize: 16 },
  meta: { color: '#666', marginTop: 2 },
  status: { color: '#0a7', fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: '#CC0000', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  btnDisabled: { backgroundColor: '#bbb' },
  btnText: { color: '#fff', fontWeight: '600' },
});
