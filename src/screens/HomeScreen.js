import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cameraTips } from '../constants/cameraTips';
import MetricCard from '../components/MetricCard';
import NoticeCard from '../components/NoticeCard';
import SectionHeader from '../components/SectionHeader';
import useAuroraData, { thresholdSummary } from '../hooks/useAuroraData';

const BULLETIN_URL = 'https://www.sws.bom.gov.au/';

function formatAge(ageMs) {
  const minutes = Math.max(1, Math.round(ageMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export default function HomeScreen() {
  const [tipsExpanded, setTipsExpanded] = useState(false);

  const {
    isBootLoading,
    isRefreshing,
    isError,
    error,
    locationLabel,
    coords,
    locationPermissionDenied,
    notificationsPermissionDenied,
    conditions,
    conditionsFreshness,
    notices,
    noticesFreshness,
    forecast,
    dataQuality,
    onRefresh,
    retryLoad,
    loadAllData,
  } = useAuroraData();

  const tipsToRender = useMemo(
    () => (tipsExpanded ? cameraTips : cameraTips.slice(0, 2)),
    [tipsExpanded]
  );

  return (
    <LinearGradient colors={['#080013', '#120b3e', '#1f0059', '#011627']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#7c4dff" />}
          contentContainerStyle={styles.container}
        >
          <Text style={styles.title}>Aurora Australis Predictor</Text>
          <Text style={styles.subtitle}>{thresholdSummary}</Text>
          <Text style={styles.quality}>Data confidence: {dataQuality}</Text>

          {locationPermissionDenied ? (
            <View style={styles.bannerWarning}>
              <Text style={styles.bannerText}>
                Location permission is off. Showing generic southern-latitude guidance only.
              </Text>
            </View>
          ) : null}

          {notificationsPermissionDenied ? (
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerText}>Notifications are disabled. You can enable them later in device settings.</Text>
            </View>
          ) : null}

          <BlurView intensity={35} tint="dark" style={styles.heroCard}>
            <Text style={styles.heroLabel}>Next 1–3 Day Outlook</Text>
            <Text style={[styles.heroRating, { color: forecast.color }]}>{forecast.rating}</Text>
            <Text style={styles.heroMessage}>{forecast.message}</Text>
            <Text style={styles.location}>{locationLabel}</Text>
            <Text style={styles.locationHint}>
              {coords && coords.latitude < -35
                ? 'You are at an aurora-favorable latitude in Australia.'
                : 'Farther south locations generally improve visibility.'}
            </Text>
          </BlurView>

          {isBootLoading ? <ActivityIndicator size="large" color="#80deea" style={styles.loader} /> : null}
          {isError ? (
            <View style={styles.errorCard}>
              <Text style={styles.error}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
                <Text style={styles.retryButtonText}>Retry loading data</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <SectionHeader title="Live Conditions" subtitle="Core indicators for aurora potential" />
          <View style={styles.freshnessRow}>
            <Text style={styles.freshnessLabel}>
              Conditions: {conditionsFreshness ? formatAge(conditionsFreshness.ageMs) : 'No timestamp'}
            </Text>
            {conditionsFreshness?.isStale ? <Text style={styles.staleBadge}>STALE</Text> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
            <MetricCard label="Kp Index" value={conditions ? `${conditions.kpIndex}` : '—'} hint="Target: 4–7" />
            <MetricCard
              label="Solar Wind"
              value={conditions ? `${conditions.solarWindSpeed} km/s` : '—'}
              hint="Target: > 450 km/s"
            />
            <MetricCard label="IMF Bz" value={conditions ? `${conditions.bz} nT` : '—'} hint="Target: negative" />
          </ScrollView>

          <SectionHeader title="Australian Notices" subtitle="Current alerts, watches, and outlooks" />
          <View style={styles.freshnessRow}>
            <Text style={styles.freshnessLabel}>
              Notices: {noticesFreshness ? formatAge(noticesFreshness.ageMs) : 'No timestamp'}
            </Text>
            {noticesFreshness?.isStale ? <Text style={styles.staleBadge}>STALE</Text> : null}
          </View>

          {notices.length ? (
            notices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)
          ) : (
            <Text style={styles.empty}>No current aurora notices published. Check again soon.</Text>
          )}

          <SectionHeader title="Camera Tips" subtitle="Quick setup for aurora photography" />
          {tipsToRender.map((tip) => (
            <Text key={tip.title} style={styles.tip}>
              <Text style={styles.tipTitle}>{tip.title}: </Text>
              {tip.description}
            </Text>
          ))}

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setTipsExpanded((value) => !value)}>
            <Text style={styles.secondaryButtonText}>{tipsExpanded ? 'Show fewer tips' : 'Show all tips'}</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.button} onPress={() => loadAllData({ showSpinner: true })}>
              <Text style={styles.buttonText}>Refresh Space Weather</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={() => Linking.openURL(BULLETIN_URL)}>
              <Text style={styles.outlineButtonText}>Open BoM SWS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40, gap: 14 },
  title: { color: 'white', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#d1c4e9', fontSize: 14, lineHeight: 20 },
  quality: { color: '#90caf9', fontSize: 12 },
  bannerWarning: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffca28',
    backgroundColor: 'rgba(255, 202, 40, 0.14)',
  },
  bannerInfo: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4fc3f7',
    backgroundColor: 'rgba(79, 195, 247, 0.14)',
  },
  bannerText: { color: '#eceff1', fontSize: 13 },
  heroCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(124,77,255,0.45)' },
  heroLabel: { color: '#b3e5fc', fontSize: 13, letterSpacing: 1.3, textTransform: 'uppercase' },
  heroRating: { fontSize: 40, fontWeight: '900', marginTop: 8 },
  heroMessage: { color: '#eceff1', marginTop: 6, fontSize: 15 },
  location: { color: '#c5cae9', marginTop: 10, fontWeight: '700' },
  locationHint: { color: '#90caf9', marginTop: 4, fontSize: 13 },
  loader: { marginVertical: 8 },
  errorCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff8a80',
    backgroundColor: 'rgba(244, 67, 54, 0.14)',
    padding: 12,
    gap: 10,
  },
  error: { color: '#ffccbc', fontWeight: '700' },
  retryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffab91',
    paddingVertical: 8,
    alignItems: 'center',
  },
  retryButtonText: { color: '#ffccbc', fontWeight: '700' },
  freshnessRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freshnessLabel: { color: '#b0bec5', fontSize: 12 },
  staleBadge: {
    color: '#1a1a1a',
    backgroundColor: '#ffab91',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '800',
    fontSize: 11,
  },
  metricsRow: { gap: 10 },
  empty: { color: '#b0bec5' },
  tip: { color: '#eceff1', lineHeight: 21 },
  tipTitle: { color: '#80deea', fontWeight: '700' },
  secondaryButton: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 222, 234, 0.6)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#80deea', fontWeight: '700', fontSize: 13 },
  actionRow: { gap: 10, marginTop: 4 },
  button: {
    backgroundColor: '#7c4dff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#7c4dff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(124,77,255,0.1)',
  },
  outlineButtonText: { color: '#d1c4e9', fontWeight: '700', fontSize: 14 },
});
