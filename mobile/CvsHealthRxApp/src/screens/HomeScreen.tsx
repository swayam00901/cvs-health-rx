import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const Tile = ({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) => (
  <Pressable style={styles.tile} onPress={onPress}>
    <Text style={styles.tileTitle}>{title}</Text>
    <Text style={styles.tileSub}>{subtitle}</Text>
  </Pressable>
);

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hello}>Welcome back</Text>
      <Tile title="Prescriptions" subtitle="Refill & reminders" onPress={() => navigation.navigate('Prescriptions')} />
      <Tile title="Find a Pharmacy" subtitle="Nearby stores & appointments" onPress={() => navigation.navigate('Pharmacies')} />
      <Tile title="Virtual Visits" subtitle="Telehealth with a provider" onPress={() => navigation.navigate('Telehealth')} />
      <Tile title="Health Records" subtitle="Lab results, allergies, visits" onPress={() => navigation.navigate('Ehr')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  hello: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  tile: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tileTitle: { fontSize: 16, fontWeight: '600', color: '#CC0000' },
  tileSub: { color: '#555', marginTop: 2 },
});
