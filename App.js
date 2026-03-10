import React, { useCallback, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import HomeScreen from './src/screens/HomeScreen';
import LaunchScreen from './src/screens/LaunchScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [showLaunch, setShowLaunch] = useState(true);

  const handleLaunchDone = useCallback(() => {
    setShowLaunch(false);
  }, []);

  return (
    <SafeAreaProvider>{showLaunch ? <LaunchScreen onDone={handleLaunchDone} /> : <HomeScreen />}</SafeAreaProvider>
  );
}
