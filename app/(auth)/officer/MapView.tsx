import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import WebView from "react-native-webview"; // Import WebView from react-native-webview
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { supabase } from "@/config/initSupabase"; // Make sure supabase is properly initialized

interface Visit {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  picture_taken_at: string;
  image_url: string;

}

const OfficerLocationTrackingWeb = () => {
  const [clerkLocations, setClerkLocations] = useState<Record<string, Visit>>({});
  const [selectedClerk, setSelectedClerk] = useState<Visit | null>(null);
  const insets = useSafeAreaInsets();

  // Fetch visits data from Supabase
  useEffect(() => {
    const fetchVisits = async () => {
      const { data, error } = await supabase.from('visits').select('*');
      if (data) {
        // Map the data into the structure we need (clerkId -> visit details)
        const locations: Record<string, Visit> = {};
        data.forEach((visit: Visit) => {
          locations[visit.id] = visit;
        });
        setClerkLocations(locations);
        console.log('Fetched visits:', data);
      } else {
        console.error('Error fetching visits:', error);
      }
    };

    fetchVisits();
  }, []);

  const centerOnUserLocation = async () => {
    console.log("Centering on user location...");
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (canAskAgain) {
          alert("Permission to access location was denied.");
        } else {
          alert("Location permission is permanently denied. Please enable it in settings.");
          // Open settings for manual permission
        }
        return;
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      console.log("User location:", latitude, longitude);
      // Center the map on the user's location
    } catch (err) {
      console.error("Error getting location:", err);
    }
  };

  // Create map HTML content based on fetched visits
  const generateMapHTML = () => {
    const markers = Object.entries(clerkLocations)
      .map(
        ([clerkId, location]) => `
          L.marker([${location.latitude}, ${location.longitude}]).addTo(map)
            .bindPopup(\`
            <div style="width: 200px; text-align: center;">
              <img src=${location.image_url} alt="Clerk Avatar" style="width: 100%; border-radius: 5px;" />
            </div>
            <b>Clerk: ${location.name}</b>
            <br>Lat: ${location.latitude.toFixed(5)}<br>
            Lng: ${location.longitude.toFixed(5)}<br>
            Last updated: ${new Date(location.picture_taken_at).toLocaleString()}
            \`);`
      )
      .join("\n");

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Clerk Location Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
          <script>
            var map = L.map('map').setView([${clerkLocations[Object.keys(clerkLocations)[0]]?.latitude || 51.505}, ${clerkLocations[Object.keys(clerkLocations)[0]]?.longitude || -0.09}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            ${markers}
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }} // Use the generated HTML for the WebView source
        style={{ flex: 1 }}
      />

      <Text style={{ position: "absolute", top: insets.top + 10, left: 10, fontSize: 16, color: "#000", backgroundColor: "rgba(255,255,255,0.7)", padding: 6, borderRadius: 8 }}>
        Tracking All Clerks
      </Text>

      {/* Button for user location */}
      <Button title="Center on User Location" onPress={centerOnUserLocation} />

      {/* Floating info box */}
      {/* {selectedClerk && (
        <View style={{ position: "absolute", bottom: 20, left: 10, padding: 10, backgroundColor: "white", borderRadius: 8, borderWidth: 1, borderColor: "#ccc" }}>
          <Text style={{ fontWeight: "bold" }}>Clerk: {selectedClerk.name}</Text>
          <Text>Lat: {selectedClerk.latitude.toFixed(5)}</Text>
          <Text>Lng: {selectedClerk.longitude.toFixed(5)}</Text>
          <Text>Last updated: {new Date(selectedClerk.picture_taken_at).toLocaleString()}</Text>
        </View>
      )} */}
    </View>
  );
};

export default OfficerLocationTrackingWeb;