import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { fetchAuroraConditions, fetchAuroraNotices } from '../services/swsApi';

const CACHE_KEY = 'aurora-dashboard-cache-v1';
const LAST_NOTIFIED_NOTICE_KEY = 'aurora-last-notified-notice-v1';
const FOREGROUND_REFRESH_MS = 15 * 60 * 1000;

export const thresholdSummary =
  'Best Aurora Australis odds: Kp 4–7, solar wind > 450 km/s, and negative Bz (southward IMF).';

function getForecast(conditions) {
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
}

function getFreshnessState(freshness) {
  if (!freshness?.fetchedAt) return null;

  const ageMs = Date.now() - freshness.fetchedAt;
  return {
    ...freshness,
    ageMs,
    isStale: ageMs > (freshness.staleAfterMs || 0),
  };
}

function getDataConfidence(conditionsFreshness, noticesFreshness, conditions) {
  const missingCount = [
    !conditions,
    !Number.isFinite(conditions?.kpIndex),
    !Number.isFinite(conditions?.solarWindSpeed),
    !Number.isFinite(conditions?.bz),
  ].filter(Boolean).length;
  const staleCount = [conditionsFreshness?.isStale, noticesFreshness?.isStale].filter(Boolean).length;

  if (missingCount === 0 && staleCount === 0) return 'High';
  if (missingCount <= 1 && staleCount <= 1) return 'Medium';
  return 'Low';
}

function getNoticeSignature(notice) {
  return `${notice.severity}:${notice.id}:${notice.issuedAt}`;
}

async function readCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(data) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Best-effort cache write, ignore failures.
  }
}

async function readLastNotifiedNotice() {
  try {
    return await AsyncStorage.getItem(LAST_NOTIFIED_NOTICE_KEY);
  } catch {
    return null;
  }
}

async function writeLastNotifiedNotice(signature) {
  try {
    await AsyncStorage.setItem(LAST_NOTIFIED_NOTICE_KEY, signature);
  } catch {
    // Best-effort storage write, ignore failures.
  }
}

export default function useAuroraData() {
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Location unavailable');
  const [coords, setCoords] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [notificationsPermissionDenied, setNotificationsPermissionDenied] = useState(false);
  const [conditions, setConditions] = useState(null);
  const [conditionsFreshnessRaw, setConditionsFreshnessRaw] = useState(null);
  const [notices, setNotices] = useState([]);
  const [noticesFreshnessRaw, setNoticesFreshnessRaw] = useState(null);
  const [error, setError] = useState('');
  const [clockTick, setClockTick] = useState(0);

  const forecast = useMemo(() => getForecast(conditions), [conditions]);
  const conditionsFreshness = useMemo(
    () => getFreshnessState(conditionsFreshnessRaw),
    [conditionsFreshnessRaw, clockTick]
  );
  const noticesFreshness = useMemo(
    () => getFreshnessState(noticesFreshnessRaw),
    [noticesFreshnessRaw, clockTick]
  );
  const dataQuality = useMemo(
    () => getDataConfidence(conditionsFreshness, noticesFreshness, conditions),
    [conditionsFreshness, noticesFreshness, conditions]
  );
  const isError = Boolean(error);

  const alertForNotices = useCallback(
    async (newNotices) => {
      const liveNotices = newNotices.filter((n) => ['alert', 'watch', 'outlook'].includes(n.severity));
      if (!liveNotices.length || notificationsPermissionDenied) return;

      const newestNotice = liveNotices[0];
      const signature = getNoticeSignature(newestNotice);
      const lastNotifiedSignature = await readLastNotifiedNotice();

      if (lastNotifiedSignature === signature) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Aurora Notice for Australia',
          body: `${newestNotice.title} (${newestNotice.severity.toUpperCase()})`,
          data: { notices: liveNotices },
        },
        trigger: null,
      });

      await writeLastNotifiedNotice(signature);
    },
    [notificationsPermissionDenied]
  );

  const hydrateFromCache = useCallback(async () => {
    const cached = await readCache();
    if (!cached) return;

    if (cached.conditions) setConditions(cached.conditions);
    if (cached.conditionsFreshness) setConditionsFreshnessRaw(cached.conditionsFreshness);
    if (Array.isArray(cached.notices)) setNotices(cached.notices);
    if (cached.noticesFreshness) setNoticesFreshnessRaw(cached.noticesFreshness);
  }, []);

  const loadAllData = useCallback(
    async ({ showSpinner = true, isUserRefresh = false } = {}) => {
      if (showSpinner) setIsBootLoading(true);
      if (isUserRefresh) setIsRefreshing(true);
      setError('');

      try {
        const [conditionPayload, noticePayload] = await Promise.all([
          fetchAuroraConditions(),
          fetchAuroraNotices('au'),
        ]);

        setConditions(conditionPayload);
        setConditionsFreshnessRaw(conditionPayload.freshness);
        setNotices(noticePayload.items);
        setNoticesFreshnessRaw(noticePayload.freshness);
        await alertForNotices(noticePayload.items);

        await writeCache({
          conditions: conditionPayload,
          conditionsFreshness: conditionPayload.freshness,
          notices: noticePayload.items,
          noticesFreshness: noticePayload.freshness,
        });
      } catch (e) {
        setError(e.message || 'Unable to load space weather data right now.');
      } finally {
        setIsBootLoading(false);
        setIsRefreshing(false);
      }
    },
    [alertForNotices]
  );

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationPermissionDenied(true);
      setLocationLabel('Location permission denied');
      return;
    }

    setLocationPermissionDenied(false);
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords(position.coords);
    setLocationLabel(`Lat ${position.coords.latitude.toFixed(2)}, Lon ${position.coords.longitude.toFixed(2)}`);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsPermissionDenied(status !== 'granted');
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => setClockTick((value) => value + 1), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const refreshIntervalId = setInterval(() => {
      loadAllData({ showSpinner: false, isUserRefresh: false });
    }, FOREGROUND_REFRESH_MS);

    return () => clearInterval(refreshIntervalId);
  }, [loadAllData]);

  useEffect(() => {
    (async () => {
      await hydrateFromCache();
      await requestLocation();
      await requestNotificationPermission();
      await loadAllData();
    })();
  }, [hydrateFromCache, loadAllData, requestLocation, requestNotificationPermission]);

  const onRefresh = useCallback(() => {
    loadAllData({ showSpinner: false, isUserRefresh: true });
  }, [loadAllData]);

  const dashboardData = {
    forecast,
    conditions,
    notices,
    freshness: {
      conditions: conditionsFreshness,
      notices: noticesFreshness,
    },
    dataQuality,
  };

  return {
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
    dashboardData,
    onRefresh,
    retryLoad: () => loadAllData({ showSpinner: true, isUserRefresh: false }),
    loadAllData,
  };
}
