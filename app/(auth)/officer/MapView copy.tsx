import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

type Visit = {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: string;
  user_id: string;
};
const MapComponent = () => {
  const initialRegion = {
    latitude:  10.8090242, // Default center (e.g. Ethiopia)
    longitude: 77.0123645,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };
  const markerCoordinates = {
    latitude: 10.8090242,
    longitude: 77.0123645,

  };

  return (
    
      <MapView
        style={{flex: 1}}
        initialRegion={initialRegion}
       
      >
          <Marker
            coordinate={markerCoordinates}
            title="Marker Title"
            description="Marker Description"
            image={require('./react-logo.png')}
          >
          
            </Marker>
         
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

export default MapComponent;
