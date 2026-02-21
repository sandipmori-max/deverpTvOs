import React, { useEffect, useState } from 'react';
import { Alert, AppState, StatusBar, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import NoInternetScreen from './src/screens/noInternet/NoInternet';
import CustomSplashScreen from './src/screens/splash/SplashScreen';
import { TranslationProvider } from './src/components/TranslationProvider';
import { ERP_COLOR_CODE } from './src/utils/constants';
import useNetworkStatus from './src/hooks/useNetworkStatus';

import {
  requestUserPermission,
  onMessageListener,
  setBackgroundMessageHandler,
  onNotificationOpenedAppListener,
  checkInitialNotification,
} from './src/firebase/firebaseService';

import { clearAllTempFiles } from './src/utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FullViewLoader from './src/components/loader/FullViewLoader';
import { useAppSelector } from './src/store/hooks';

const App = () => {
  return (
    <Provider store={store}>
      <TranslationProvider>
        <AppContent />
      </TranslationProvider>
    </Provider>
  );
};

const AppContent = () => {
  const isConnected = useNetworkStatus();
  const theme = useAppSelector(state => state?.theme?.mode);

  const statusBarColor =
    theme === 'dark'
      ? '#000000'
      : ERP_COLOR_CODE.ERP_APP_COLOR;

  const barStyle ='light-content';

  const [isSplashVisible, setSplashVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const checkAcceptance = async () => {
      const value = await AsyncStorage.getItem('TERMS_ACCEPTED');
      if (value === 'true') {
        setAccepted(true);
      }
      setIsLoading(false);
    };
    checkAcceptance();
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem('TERMS_ACCEPTED', 'true');
    setAccepted(true);
  };

  useEffect(() => {
    clearAllTempFiles();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background') {
        clearAllTempFiles();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    requestUserPermission();
    setBackgroundMessageHandler();

    const unsubscribeForeground = onMessageListener(remoteMessage => {
      Alert.alert(
        remoteMessage?.notification?.title ?? 'New Message',
        remoteMessage?.notification?.body ?? JSON.stringify(remoteMessage?.data),
      );
    });

    const unsubscribeBackground = onNotificationOpenedAppListener(remoteMessage => {
      Alert.alert('App opened from background', JSON.stringify(remoteMessage?.data));
    });

    checkInitialNotification(remoteMessage => {
      Alert.alert('App opened from quit state', JSON.stringify(remoteMessage?.data));
    });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <FullViewLoader />
      </View>
    );
  }

  // if (!accepted) {
  //   return <TermsAndConsent onAccept={handleAccept} />;
  // }

  if (!isConnected) {
    return (
      <>
        <StatusBar backgroundColor={statusBarColor} barStyle={barStyle} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: statusBarColor }} />
        <SafeAreaView style={styles.safeArea}>
          <NoInternetScreen onRetry={() => {}} />
        </SafeAreaView>
      </>
    );
  }

  if (isSplashVisible) {
    return (
      <>
        <StatusBar backgroundColor={statusBarColor} barStyle={barStyle} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: statusBarColor }} />
        <SafeAreaView style={styles.safeArea}>
          <CustomSplashScreen onFinish={() => setSplashVisible(false)} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar backgroundColor={statusBarColor} barStyle={barStyle} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: statusBarColor }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
  },
});

export default App;
