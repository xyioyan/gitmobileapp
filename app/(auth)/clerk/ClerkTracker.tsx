import React, { useEffect, useRef, useState } from 'react';
import { View, Button } from 'react-native';
import * as Location from 'expo-location';
import { ref, set } from 'firebase/database';
import { db } from '@/config/firebaseConfig';
import { useAuth } from '@/provider/AuthProvider';

const ClerkTracker = () => {
  const { session } = useAuth();
  const clerkId = session?.user.id;
  const clerkName = session?.user.user_metadata.name;

  const [tracking, setTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (loc) => {
          const locationRef = ref(db, `locations/${clerkId}`);
          set(locationRef, {
            name: clerkName,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: new Date().toISOString(),
          }).catch((err) => console.error('Firebase update error:', err));
        }
      );
    };

    const stopTracking = () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };

    if (tracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [tracking]);

  return (
    <View>
      <Button
        title={tracking ? 'Stop Tracking' : 'Start Tracking'}
        onPress={() => setTracking((prev) => !prev)}
      />
    </View>
  );
};

export default ClerkTracker;