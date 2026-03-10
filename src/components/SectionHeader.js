import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2, marginTop: 2 },
  title: { color: 'white', fontSize: 17, fontWeight: '700' },
  subtitle: { color: '#90a4ae', fontSize: 12 },
});
