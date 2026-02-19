import { useEffect, useState, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type Coords = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export const useCurrentAddress = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- ANDROID PERMISSION ----------
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

  // ---------- GET STABLE LOCATION ----------
  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      setLoading(false);
      return;
    }

    let bestLocation: any = null;
    let readings = 0;

    const watchId = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        console.log('Lat:', latitude);
        console.log('Lng:', longitude);
        console.log('Accuracy:', accuracy);

        readings++;

        // Pick best accuracy
        if (!bestLocation || accuracy < bestLocation.coords.accuracy) {
          bestLocation = pos;
        }

        // Stop conditions:
        // 1. Good accuracy achieved (<= 20m)
        // 2. 3 readings taken
        if (accuracy <= 20 || readings >= 3) {
          Geolocation.clearWatch(watchId);

          if (bestLocation.coords.accuracy > 50) {
            setError('Weak GPS signal. Try open area.');
            setLoading(false);
            return;
          }

          setCoords({
            latitude: bestLocation.coords.latitude,
            longitude: bestLocation.coords.longitude,
            accuracy: bestLocation.coords.accuracy,
          });

          setAddress(
            `${bestLocation.coords.latitude},${bestLocation.coords.longitude}`
          );

          setLoading(false);
        }
      },
      (err) => {
        Geolocation.clearWatch(watchId);
        setError(err.message || 'Unable to fetch location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,   // ✅ Always GPS
        timeout: 25000,
        maximumAge: 0,              // ✅ No cached location
        distanceFilter: 0,
      }
    );
  }, []);

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    address,
    coords,
    loading,
    error,
    refetch: getLocation,
  };
};
