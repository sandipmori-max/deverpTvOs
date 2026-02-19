import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export async function requestUserPermission(): Promise<void> {
  try {
    const authStatus = await messaging().requestPermission({
      sound: true,
      announcement: true,
      alert: true,
      badge: true,
      carPlay: true,
      criticalAlert: true,
      provisional: true,
    });

    switch (authStatus) {
      case messaging.AuthorizationStatus.AUTHORIZED:
        await getFcmToken();
        break;
      case messaging.AuthorizationStatus.PROVISIONAL:
        await getFcmToken();
        break;
      case messaging.AuthorizationStatus.DENIED:
        Alert.alert(
          'Permission Denied',
          'You have denied notification permission. Please enable it in Settings to receive alerts.'
        );
        break;
      case messaging.AuthorizationStatus.NOT_DETERMINED:
        Alert.alert(
          'Permission Not Determined',
          'Please decide whether to allow notifications to stay updated.'
        );
        break;
      default:
    }
  } catch (error) {
  }
}

export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    if (token) {
      return token;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function onMessageListener(
  callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
) {
  return messaging().onMessage(async remoteMessage => {
    callback(remoteMessage);
  });
}

export function setBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    }
  );
}

/**
 * App opened from background (user taps on notification).
 */
export function onNotificationOpenedAppListener(
  callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
) {
  return messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage) {
      callback(remoteMessage);
    }
  });
}

/**
 * App opened from killed/quit state (user taps on notification).
 */
export async function checkInitialNotification(
  callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
) {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    callback(remoteMessage);
  }
}
