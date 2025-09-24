import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, NativeModules } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStateThunk } from '../store/slices/auth/thunk';
import DevERPService from '../services/api/deverp';
import AuthNavigator from './AuthNavigator';
import StackNavigator from './StackNavigator';
import FullViewLoader from '../components/loader/FullViewLoader';
import DeviceInfo from 'react-native-device-info';
import CustomAlert from '../components/alert/CustomAlert';
import { generateGUID } from '../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestLocationPermissions } from '../utils/helpers';

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated, accounts } = useAppSelector(state => state.auth);
  console.log('isAuthenticated', isAuthenticated);
  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  const [modalClose, setModalClose] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  const [hasSyncedDisabledLocation, setHasSyncedDisabledLocation] = useState(false);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (alreadyGranted) {
          console.log('✅ Location permission already granted');
          return true;
        }

        // Build permission list
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        if (Platform.Version >= 34) {
          permissions.push(PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE_LOCATION);
        }

        console.log('📌 Requesting location permissions:', permissions);

        // Ask user
        const results = await PermissionsAndroid.requestMultiple(permissions);

        console.log('📌 Location permission results:', results);

        // Verify all permissions granted
        const allGranted = Object.values(results).every(
          r => r === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (allGranted) {
          console.log('✅ Location permissions granted');
          return true;
        } else {
          console.log('❌ Location permissions denied');
          return false;
        }
      } catch (err) {
        console.warn('⚠️ requestLocationPermission error:', err);
        return false;
      }
    }

    return true;
  };

  const app_id = generateGUID();

  useEffect(() => {
    const fetchDeviceName = async () => {
      const name = await DeviceInfo.getDeviceName();

      let appid = await AsyncStorage.getItem('appid');
      if (!appid) {
        appid = app_id;
        await AsyncStorage.setItem('appid', appid);
      }
      await AsyncStorage.setItem('device', name);

      DevERPService.initialize();
      DevERPService.setAppId(appid);
      DevERPService.setDevice(name);

      dispatch(checkAuthStateThunk());
    };

    fetchDeviceName();
  }, [dispatch]);

  // for location debug -----------
  useEffect(() => {
    const checkLocation = async () => {
      if (isAuthenticated === false) {
        return;
      }
      const enabled = await DeviceInfo.isLocationEnabled();

      console.log('🚀 ~ checkLocation ~ enabled + + + enabled :', enabled);

      if (locationEnabled === null) {
        if (!enabled) {
          setAlertConfig({
            title: 'Location Status',
            message:
              'To continue using our services, please enable location access. Without location permissions, you won’t be able to use this app',
            type: 'error',
          });
          setAlertVisible(true);
        }
        setLocationEnabled(enabled);
        return;
      }

      if (enabled !== locationEnabled) {
        setAlertConfig({
          title: 'Location Status',
          message: enabled
            ? `Location is now enabled`
            : 'To continue using our services, please enable location access. Without location permissions, you won’t be able to use this app',
          type: enabled ? 'success' : 'error',
        });
        setAlertVisible(true);
      }

      setModalClose(enabled);
      setLocationEnabled(enabled);

      if (isAuthenticated) {
        console.log('🚀 ~ checkLocation ~ enabled:', enabled);
        if (enabled) {
          setHasSyncedDisabledLocation(false);

          const hasPermission = await requestLocationPermission();
          console.log('🚀 ~ checkLocation ~ hasPermission:', hasPermission);

          if (hasPermission === false || enabled === false) {
            setAlertConfig({
              title: 'Location Status',
              message:
                'To continue using our services, please enable location access. Without location permissions, you won’t be able to use this app',
              type: 'error',
            });
            setAlertVisible(true);
            setModalClose(false);
            return;
          }
          if (!hasPermission) return;

          try {
            if (accounts.length > 0) {
              if (Platform.OS === 'android') {
                requestLocationPermissions().then(granted => {
                  console.log('🚀 ~ checkLocation ~ granted-------------------:', granted);
                  console.log('🚀 ~ checkLocation ~ isAuthenticated:', isAuthenticated);
                  if (granted && isAuthenticated) {
                    const data = accounts.map(u => ({
                      token: u?.user?.token,
                      link: u?.user?.companyLink,
                    }));
                    console.log(
                      '🚀 ~ checkLocation companyLink ---------------------~ data:',
                      data,
                    );

                    NativeModules.LocationModule.setUserTokens(data);
                    NativeModules.LocationModule?.startService();
                  } else {
                    setAlertConfig({
                      title: 'Location Status',
                      message:
                        'To continue using our services, please enable location access. Without location permissions, you won’t be able to use this app',
                      type: 'error',
                    });
                    setAlertVisible(true);
                    setModalClose(false)
                  }
                });
              }
            }
          } catch (err) {
            console.log('Location fetch error:', err);
          }
        } else {
          console.log('🚀 ~ checkLocation ~ enabled: else ------------------------');
        }
      }
    };
    if (isAuthenticated) {
      checkLocation();
    }

    const interval = setInterval(checkLocation, 1800);
    return () => clearInterval(interval);
  }, [locationEnabled, accounts, dispatch, isAuthenticated, hasSyncedDisabledLocation]);

  if (isLoading) {
    return <FullViewLoader />;
  }

  return (
    <>
      {isAuthenticated ? <StackNavigator /> : <AuthNavigator />}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          if (modalClose) {
            setAlertVisible(false);
          }
        }}
        actionLoader={undefined}
      />
    </>
  );
};

export default RootNavigator;
