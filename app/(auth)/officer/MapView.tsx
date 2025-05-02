import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { supabase } from '@/config/initSupabase';

type Visit = {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: string;
  user_id: string;
};

const OfficerMapScreen = () => {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    const { data, error } = await supabase.from('visits').select('*');
    if (data) {setVisits(data);
    console.log('Fetched visits:', data);}
    else console.error('Error fetching visits:', error);
  };

  return (
    
      <MapView
        style={styles.map}
        initialRegion={{
          latitude:  10.8090242, // Default center (e.g. Ethiopia)
          longitude: 77.0123645,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {visits.map((visit) => (
          <Marker
            key={visit.id}
            coordinate={{ latitude: visit.latitude, longitude: visit.longitude }}
          >
          <Callout onPress={() => console.log('Marker pressed!')}>
            <View style={{ width: 150 }}>
              <Text>{visit.description}</Text>
            </View>
          </Callout>
            </Marker>
         
        ))}
      </MapView>
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
});

export default OfficerMapScreen;
