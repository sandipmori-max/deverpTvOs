import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import { addLocation } from '../../../../store/slices/auth/authSlice';

const LocationTrackScreen = () => {
  const dispatch = useDispatch();
  const locations = useSelector(state => state.auth.locationLogs);

  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        const newLocation = {
          id: Date.now().toString(),
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          time: new Date().toLocaleTimeString(),
        };

        dispatch(addLocation(newLocation));
      },
      error => {
        console.log('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();

    intervalRef.current = setInterval(() => {
      getCurrentLocation();
    }, 5000);

    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = secs => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hrs}h ${mins}m ${seconds}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Work Session Tracking</Text>

      <View style={styles.card}>
        <Text style={styles.active}>🟢 Tracking Active</Text>
        <Text style={styles.info}>Session Duration: {formatDuration(duration)}</Text>
        <Text style={styles.info}>Location Points Collected: {locations.length}</Text>
        <Text style={styles.small}>
          Your location is being recorded in the background
          to generate accurate attendance and work reports.
        </Text>
      </View>

      <Text style={styles.subHeader}>Recent Location Logs</Text>

      <FlatList
        data={locations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.time}>{item.time}</Text>
            <Text style={styles.coords}>
              {item.latitude}, {item.longitude}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default LocationTrackScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 16,
    margin: 12
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  active: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
  },
  small: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
  },
  coords: {
    fontSize: 12,
    color: '#444',
  },
});
