import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MetricCard({ label, value, hint }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.45)',
  },
  label: { color: '#b2ebf2', fontWeight: '700', fontSize: 13 },
  value: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 6 },
  hint: { color: '#b0bec5', marginTop: 2 },
});
