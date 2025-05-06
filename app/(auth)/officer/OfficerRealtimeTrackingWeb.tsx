// MapPage.tsx
'use client';
import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/config/firebaseConfig";
import { Button, Text, View } from "react-native";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import L from "leaflet"; // Import Leaflet for web map rendering
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS for web

interface ClerkLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  name: string;
}

const OfficerRealtimeTrackingWeb = () => {
  const [clerkLocations, setClerkLocations] = useState<Record<string, ClerkLocation>>({});
  const mapRef = useRef<HTMLDivElement>(null); // Reference for map container

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

    return () => {
      off(locationRef, "value", callback);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      // Initialize the map when the component mounts
      const map = L.map(mapRef.current).setView([51.505, -0.09], 13); // Default to a generic location

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add markers for each clerk location
      Object.values(clerkLocations).forEach((location) => {
        L.marker([location.latitude, location.longitude])
          .addTo(map)
          .bindPopup(`
            <div style="width: 200px; text-align: center;">
              <img src="https://sm.ign.com/ign_pk/cover/a/avatar-gen/avatar-generations_rpge.jpg" alt="Clerk Avatar" style="width: 100%; border-radius: 50%;" />
            </div>
            <b>Clerk: ${location.name}</b>
            <br>Lat: ${location.latitude.toFixed(5)}<br>
            Lng: ${location.longitude.toFixed(5)}<br>
            Last updated: ${new Date(location.timestamp).toLocaleString()}
          `);
      });
    }
  }, [clerkLocations]);

  const centerOnUserLocation = async () => {
    console.log("Centering on user location...");
    try {
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

      // Re-center map to user's location
      if (mapRef.current) {
        const map = L.map(mapRef.current);
        map.setView([latitude, longitude], 13); // Re-center map
      }
    } catch (err) {
      console.error("Error getting location:", err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }}></div>

      <Button title="Center on User Location" onPress={centerOnUserLocation} />

      <Text style={{ position: "absolute", top: 10, left: 10, fontSize: 16, color: "#000", backgroundColor: "rgba(255,255,255,0.7)", padding: 6, borderRadius: 8 }}>
        Tracking All Clerks
      </Text>
    </View>
  );
};

export default OfficerRealtimeTrackingWeb;
