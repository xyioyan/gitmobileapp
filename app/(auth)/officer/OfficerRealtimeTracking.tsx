import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/config/firebaseConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from "expo-linking";


interface ClerkLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  name: string;
}

const OfficerLocationTracking = () => {
  const [selectedClerk, setSelectedClerk] = useState<ClerkLocation | null>(null);
  const [selectedMarkerCoordinate, setSelectedMarkerCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [clerkLocations, setClerkLocations] = useState<
    Record<string, ClerkLocation>
  >({});
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const locationRef = ref(db, "locations");
  
    const callback = (snapshot: any) => {
      const data = snapshot.val();
      if (data && typeof data === "object") {
        setClerkLocations(data);
      } else {
        setClerkLocations({});
      }
    };
  
    onValue(locationRef, callback);
  
    // Clean up listener on unmount
    return () => {
      off(locationRef, "value", callback);
    };
  }, []);
  



  const centerOnUserLocation = async () => {
    console.log("Centering on user location...");
    try {
      // Request permission
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      if (canAskAgain) {
        alert("Permission to access location was denied.");
      } else {
        alert("Location permission is permanently denied. Please enable it in settings.");
        await Linking.openSettings(); // Opens app settings for manual permission
      }
      return;
    }


      // Get location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      console.log("User location:", latitude, longitude);
  
      // Animate map to user's current location
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.error("Error getting location:", err);
    }
  };
  const handleMarkerPress = (clerkId: string, location: ClerkLocation, coordinate: { latitude: number; longitude: number }) => {
    setSelectedClerk(location);
    setSelectedMarkerCoordinate(coordinate);
  };
  const firstClerk = Object.values(clerkLocations)[0];

  const region = firstClerk
    ? {
        latitude: firstClerk.latitude,
        longitude: firstClerk.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 1,
      longitudeDelta: 1,
      };
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const mapRef = useRef<MapView>(null);


  return (
    <View style={styles.container}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        ref = {mapRef}
        provider={undefined}
        showsUserLocation={true}
        mapType={mapType} // <-- Add this line
      >
        {/* Use OpenStreetMap tiles */}
        {mapType == "standard" && (
          <UrlTile
            urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        )}

        {mapType === "satellite" && (
          <UrlTile
            urlTemplate="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maximumZ={19}
          />
        )}
        {Object.entries(clerkLocations).map(([clerkId, location]) => (
          <Marker
            key={clerkId}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={`Clerk: ${location.name}`}
            description={`Last updated: ${new Date(
              location.timestamp
            ).toLocaleString()}`}
            onPress={() =>{ handleMarkerPress(clerkId, location, { latitude: location.latitude, longitude: location.longitude });console.log(clerkId, location)}}
          />
        ))}
      </MapView>
      <Text style={[styles.text, { top: insets.top + 10 }]}>
        Tracking All Clerks
      </Text>
      {/* Buttons */}
      <TouchableOpacity style={styles.myLocationButton} onPress={() => {
        centerOnUserLocation();}}> 
        <Ionicons name="locate-outline" size={24} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.mapTypeButton}
        onPress={() =>
          setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))
        }
      >
        <Text style={styles.buttonText}>
          {mapType === "standard" ? "Satellite" : "Standard"}
        </Text>
      </TouchableOpacity>
      {/* Floating info box (callout-like) */}
      
        {selectedClerk && selectedMarkerCoordinate && (
          <View style={[styles.infoBox, { top: selectedMarkerCoordinate.latitude , left: selectedMarkerCoordinate.longitude  }]}>
            <Text style={styles.infoTitle}>Clerk: {selectedClerk.name}</Text>
            <Text>name: {selectedClerk.name}</Text>
            <Text>Lat: {selectedClerk.latitude.toFixed(5)}</Text>
            <Text>Lng: {selectedClerk.longitude.toFixed(5)}</Text>
            <Text>Last updated: {new Date(selectedClerk.timestamp).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => setSelectedClerk(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
     

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeBtn: {
    marginTop: 10,
    backgroundColor: '#ff4d4d',
    paddingVertical: 5,
    borderRadius: 5,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#2b825b",
    padding: 12,
    borderRadius: 50,
    elevation: 5,
  },
  closeText: {
    color: '#fff',
    textAlign: 'center',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  infoBox: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 10,
    minWidth: 150,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  text: {
    position: "absolute",
    left: 10,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 8,
  },
  mapTypeButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#2b825b",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    elevation: 5,
  },
});

export default OfficerLocationTracking;
