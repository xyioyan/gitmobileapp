import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import * as Location from "expo-location";
import { ref, set } from "firebase/database";
import { db } from "@/config/firebaseConfig";
import { useAuth } from "@/provider/AuthProvider";
import { supabase } from "@/config/initSupabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const ClerkTracker = () => {
  const { session } = useAuth();
  const clerkId: string = session?.user.id ?? "";
  const clerkName = session?.user.user_metadata.name ?? "";
  const [avatar, setAvatar] = useState("");
  const [tracking, setTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Fetch avatar when clerkId becomes available
  useEffect(() => {
    const fetchAvatar = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("profile_image_url")
        .eq("id", clerkId)
        .single();

      if (error) {
        console.warn("Error fetching avatar:", error.message);
      } else {
        console.log("Avatar fetched:", data.profile_image_url);
        setAvatar(data.profile_image_url);
      }
    };

    if (clerkId) {
      fetchAvatar();
    }
  }, [clerkId]);

  // Handle start/stop location tracking
  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      console.log("Starting location tracking...");
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // shorter for testing
          distanceInterval: 5,
        },
        (loc) => {
          console.log("Location update:", loc.coords);

          const locationRef = ref(db, `locations/${clerkId}`);
          set(locationRef, {
            avatar,
            name: clerkName,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: new Date().toISOString(),
          })
            .then(() => {
              console.log("Location stored in Firebase");
            })
            .catch((err) => {
              console.error("Firebase update error:", err);
            });
        }
      );
    };

    const stopTracking = () => {
      console.log("Stopping tracking...");
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };

    if (tracking && avatar) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [tracking, avatar]);

  return (
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={() => {
        console.log("Toggling tracking. Current state:", tracking);
        setTracking((prev) => !prev);
      }}
    >
      <LinearGradient
        colors={["#4f46e5", "#7c3aed"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name={tracking ? "stop" : "play"} size={20} color="white" />
        <Text style={styles.primaryButtonText}>
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ClerkTracker;

const styles = StyleSheet.create({
  primaryButton: {
    marginLeft: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});
