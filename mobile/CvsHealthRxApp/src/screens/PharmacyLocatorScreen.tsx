import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { PharmaciesApi } from '../services/api';

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  phone: string;
  offersVaccines: boolean;
  offersMinuteClinic: boolean;
};

export default function PharmacyLocatorScreen() {
  const patientId = useSelector((s: RootState) => s.session.patientId) ?? 'demo-patient';
  const [items, setItems] = useState<Pharmacy[]>([]);

  useEffect(() => {
    // Fallback coords: Woonsocket, RI (CVS HQ) for demo.
    PharmaciesApi.nearby(41.9983, -71.515).then(setItems).catch((e) => Alert.alert('Error', e.message));
  }, []);

  const book = async (pharmacyId: string) => {
    try {
      const startsAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await PharmaciesApi.book({ patientId, pharmacyId, kind: 'Vaccine', startsAt });
      Alert.alert('Appointment booked', 'See you tomorrow.');
    } catch (e: any) {
      Alert.alert('Booking failed', e.message);
    }
  };

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.address}</Text>
          <Text style={styles.meta}>{item.phone}</Text>
          <View style={styles.tags}>
            {item.offersVaccines && <Text style={styles.tag}>Vaccines</Text>}
            {item.offersMinuteClinic && <Text style={styles.tag}>MinuteClinic</Text>}
          </View>
          <Pressable style={styles.btn} onPress={() => book(item.id)}>
            <Text style={styles.btnText}>Book appointment</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10 },
  name: { fontWeight: '600', fontSize: 16 },
  meta: { color: '#666', marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 12 },
  btn: { marginTop: 10, backgroundColor: '#CC0000', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
