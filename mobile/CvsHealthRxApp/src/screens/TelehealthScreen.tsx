import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { TelehealthApi } from '../services/api';

export default function TelehealthScreen() {
  const patientId = useSelector((s: RootState) => s.session.patientId) ?? 'demo-patient';
  const [provider, setProvider] = useState('Dr. Patel');
  const [visitId, setVisitId] = useState<string | null>(null);

  const schedule = async () => {
    try {
      const scheduledAt = new Date(Date.now() + 3600 * 1000).toISOString();
      const v = await TelehealthApi.schedule({ patientId, providerName: provider, scheduledAt });
      setVisitId(v.id);
      Alert.alert('Scheduled', `Visit ${v.id} with ${provider}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const join = async () => {
    if (!visitId) return;
    try {
      const { sessionToken } = await TelehealthApi.join(visitId);
      // Hand token to WebRTC layer (react-native-webrtc). Stub:
      Alert.alert('Joining visit', `Session token: ${sessionToken.slice(0, 8)}…`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Provider</Text>
      <TextInput style={styles.input} value={provider} onChangeText={setProvider} />
      <Pressable style={styles.btn} onPress={schedule}>
        <Text style={styles.btnText}>Schedule Visit</Text>
      </Pressable>
      {visitId && (
        <Pressable style={[styles.btn, { backgroundColor: '#0a7' }]} onPress={join}>
          <Text style={styles.btnText}>Join Visit</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label: { fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#ddd' },
  btn: { backgroundColor: '#CC0000', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
