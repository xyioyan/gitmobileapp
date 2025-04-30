import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/config/initSupabase';
import { Image, Text } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const OfficerMapView = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);
      fetchVisits(coords);
    })();
  }, []);

  const fetchVisits = async (userLocation: { latitude: number; longitude: number }) => {
    const { data, error } = await supabase.from('visits').select('*');
    
    if (data) {
      setVisits(data);
      console.log('Fetched visits:', data);
      // Find nearest visit
      let nearest = data[0];
      let minDist = getDistance(userLocation, nearest);

      for (let i = 1; i < data.length; i++) {
        const dist = getDistance(userLocation, data[i]);
        if (dist < minDist) {
          nearest = data[i];
          minDist = dist;
        }
      }
      

      // Auto focus to nearest marker
      mapRef.current?.animateToRegion({
        latitude: nearest.latitude,
        longitude: nearest.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }else {
      console.error('Error fetching visits:', error);
    return;
    }
  };

  const getDistance = (
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number }
  ) => {
    return Math.sqrt(
      Math.pow(a.latitude - b.latitude, 2) + Math.pow(a.longitude - b.longitude, 2)
    );
  };

  const centerToUser = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        ...location,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.latitude || 9.005401,
          longitude: location?.longitude || 38.763611,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
      >
        {visits.map((visit) => (
          console.log('Visit:', visit.image_url),
          <Marker
            key={visit.id}
            coordinate={{ latitude: visit.latitude, longitude: visit.longitude }}
            pinColor="blue"
          >
            <Callout>
              <View style={{ maxWidth: 200 }}>
              {visit.image_urls ? <Image style={{ width: 80, height: 80 }} source={{ uri: visit.image_url}} /> : <View style={{ width: 80, height: 80, backgroundColor: '#1A1A1A' }} />}
                <Text style={{ fontWeight: 'bold' }}>{visit.description}</Text>
                <Text>{visit.timestamp}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Locate Me button */}
      <TouchableOpacity style={styles.locateButton} onPress={centerToUser}>
        <Ionicons name="locate-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  locateButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#2b825b',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
  },
});

export default OfficerMapView;
