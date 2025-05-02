import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Location from 'expo-location';
import { ref, set } from 'firebase/database';
import { db } from '@/config/firebaseConfig'; // Adjust the import based on your project structure
import { useAuth } from '@/provider/AuthProvider';
import { Slot } from 'expo-router';

const ClerkTracker = () => {
  const { session } = useAuth();
  const clerkId = session?.user.id;
  const clerkName = session?.user.user_metadata.name;

  const [tracking, setTracking] = useState(true); // Track if location tracking is active
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
  
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
  
      try {
        subscription = await Location.watchPositionAsync(
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
      } catch (error) {
        console.error('Error starting location tracking:', error);
      }
    };
  
    if (tracking) {
      startTracking();
    }
  
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [clerkId, clerkName, tracking]);
  
  
  // Control tracking start/stop based on conditions
  const toggleTracking = () => {
    setTracking((prev) => !prev); // Toggle location tracking on/off
  };

  return (
    <View>
      <Slot />
      
    </View>
  );
};

export default ClerkTracker;
