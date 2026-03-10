import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { fetchAuroraConditions, fetchAuroraNotices } from './src/services/swsApi';
import { cameraTips } from './src/constants/cameraTips';
import MetricCard from './src/components/MetricCard';
import NoticeCard from './src/components/NoticeCard';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const thresholdSummary =
  'Best Aurora Australis odds: Kp 4–7, solar wind > 450 km/s, and negative Bz (southward IMF).';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Location unavailable');
  const [coords, setCoords] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

  const forecast = useMemo(() => {
    if (!conditions) return { rating: 'Unknown', message: 'Waiting for data…', color: '#b0bec5' };

    const kpGood = conditions.kpIndex >= 4 && conditions.kpIndex <= 7;
    const windGood = conditions.solarWindSpeed > 450;
    const bzGood = conditions.bz < 0;

    if (kpGood && windGood && bzGood) {
      return {
        rating: 'Excellent',
        message: 'High chance over next 1–3 days if skies stay clear.',
        color: '#7c4dff',
      };
    }

    if ((kpGood && bzGood) || (kpGood && windGood)) {
      return {
        rating: 'Promising',
        message: 'Conditions are trending aurora-friendly. Keep monitoring updates.',
        color: '#26c6da',
      };
    }

    return {
      rating: 'Low',
      message: 'Current space weather is not strongly aligned for aurora visibility.',
      color: '#78909c',
    };
  }, [conditions]);

  const alertForNotices = async (newNotices) => {
    const liveNotices = newNotices.filter((n) => ['alert', 'watch', 'outlook'].includes(n.severity));
    if (!liveNotices.length) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Aurora Notice for Australia',
        body: `${liveNotices[0].title} (${liveNotices[0].severity.toUpperCase()})`,
        data: { notices: liveNotices },
      },
      trigger: null,
    });
  };

  const loadAllData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');

    try {
      const [conditionData, noticeData] = await Promise.all([
        fetchAuroraConditions(),
        fetchAuroraNotices('au'),
      ]);
      setConditions(conditionData);
      setNotices(noticeData);
      await alertForNotices(noticeData);
    } catch (e) {
      setError(e.message || 'Unable to load space weather data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location permission needed',
        'Please allow location access so the app can estimate local aurora visibility for your latitude.'
      );
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords(position.coords);
    setLocationLabel(`Lat ${position.coords.latitude.toFixed(2)}, Lon ${position.coords.longitude.toFixed(2)}`);
  };

  useEffect(() => {
    (async () => {
      await requestLocation();
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Notifications disabled', 'Enable notifications to receive aurora alert/watch/outlook notices.');
      }
      await loadAllData();
    })();
  }, []);

  return (
    <LinearGradient colors={['#080013', '#120b3e', '#1f0059', '#011627']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAllData(false); }} tintColor="#7c4dff" />}
          contentContainerStyle={styles.container}
        >
          <Text style={styles.title}>Aurora Australis Predictor</Text>
          <Text style={styles.subtitle}>{thresholdSummary}</Text>

          <BlurView intensity={40} tint="dark" style={styles.heroCard}>
            <Text style={styles.heroLabel}>1–3 Day Outlook</Text>
            <Text style={[styles.heroRating, { color: forecast.color }]}>{forecast.rating}</Text>
            <Text style={styles.heroMessage}>{forecast.message}</Text>
            <Text style={styles.location}>{locationLabel}</Text>
            {coords ? <Text style={styles.locationHint}>Higher southern latitude improves viewing probability.</Text> : null}
          </BlurView>

          {loading ? <ActivityIndicator size="large" color="#26c6da" style={styles.loader} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {conditions ? (
            <View style={styles.metricsRow}>
              <MetricCard label="Kp Index" value={conditions.kpIndex} hint="Target 4–7" />
              <MetricCard label="Solar Wind" value={`${conditions.solarWindSpeed} km/s`} hint="> 450 km/s" />
              <MetricCard label="IMF Bz" value={`${conditions.bz} nT`} hint="Negative is best" />
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Australian Aurora Notices</Text>
            {notices.length ? notices.map((n) => <NoticeCard key={n.id} notice={n} />) : <Text style={styles.empty}>No current alert/watch/outlook notices.</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aurora Camera Settings</Text>
            {cameraTips.map((tip) => (
              <Text key={tip.title} style={styles.tip}><Text style={styles.tipTitle}>{tip.title}: </Text>{tip.description}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={() => loadAllData(false)}>
            <Text style={styles.buttonText}>Refresh Space Weather</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40, gap: 14 },
  title: { color: 'white', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#d1c4e9', fontSize: 14, lineHeight: 20 },
  heroCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(124,77,255,0.45)' },
  heroLabel: { color: '#b3e5fc', fontSize: 13, letterSpacing: 1.3, textTransform: 'uppercase' },
  heroRating: { fontSize: 40, fontWeight: '900', marginTop: 8 },
  heroMessage: { color: '#eceff1', marginTop: 6, fontSize: 15 },
  location: { color: '#c5cae9', marginTop: 10, fontWeight: '700' },
  locationHint: { color: '#90caf9', marginTop: 4, fontSize: 13 },
  loader: { marginVertical: 8 },
  error: { color: '#ff8a80', fontWeight: '700' },
  metricsRow: { gap: 10 },
  section: { marginTop: 10, gap: 8 },
  sectionTitle: { color: 'white', fontSize: 17, fontWeight: '700' },
  empty: { color: '#b0bec5' },
  tip: { color: '#eceff1', lineHeight: 21 },
  tipTitle: { color: '#80deea', fontWeight: '700' },
  button: {
    marginTop: 8,
    backgroundColor: '#7c4dff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
