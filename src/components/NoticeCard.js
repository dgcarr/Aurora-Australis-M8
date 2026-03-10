import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const noticeColors = {
  alert: '#ff7043',
  watch: '#ffca28',
  outlook: '#29b6f6',
};

export default function NoticeCard({ notice }) {
  const color = noticeColors[notice.severity] || '#90a4ae';

  return (
    <View style={[styles.card, { borderColor: color }]}> 
      <Text style={[styles.badge, { color }]}>{notice.severity.toUpperCase()}</Text>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.body}>{notice.message}</Text>
      <Text style={styles.time}>Issued: {notice.issuedAt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  badge: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  title: { color: 'white', fontWeight: '800', fontSize: 16 },
  body: { color: '#eceff1', lineHeight: 20 },
  time: { color: '#b0bec5', fontSize: 12, marginTop: 2 },
});
