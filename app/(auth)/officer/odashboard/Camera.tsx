import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Button,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  type CameraCapturedPicture,
} from "expo-camera";
import * as Location from "expo-location";
import { useAuth } from "@/provider/AuthProvider";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function CaptureVisitScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Check location services when component mounts
  useEffect(() => {
    const checkLocationServices = async () => {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setLocationError("Location services are disabled");
      }
    };
    checkLocationServices();
  }, []);
  if (permission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>Checking camera permissions...</Text>
      </View>
    );
  }
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  const toggleFacing = () =>
    setFacing((prev) => (prev === "back" ? "front" : "back"));

  const toDMS = (deg: number, isLat: boolean): string => {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(1);
    const direction = isLat ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  const getHighAccuracyLocation = async (
    retryCount = 0
  ): Promise<Location.LocationObject> => {
    try {
      setIsLocationLoading(true);
      setLocationError(null);

      // First check if services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error("Location services disabled");
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 10000, // Wait up to 10 seconds
        distanceInterval: 0, // Get the best possible regardless of movement
      });

      // Validate coordinates
      if (
        !location.coords ||
        isNaN(location.coords.latitude) ||
        isNaN(location.coords.longitude)
      ) {
        throw new Error("Invalid coordinates received");
      }

      // Check for suspicious coordinates (0,0)
      if (
        Math.abs(location.coords.latitude) < 0.001 &&
        Math.abs(location.coords.longitude) < 0.001
      ) {
        throw new Error("Invalid coordinates (0,0)");
      }

      setLocationAccuracy(location.coords.accuracy);
      return location;
    } catch (error) {
      if (retryCount < 2) {
        // Retry up to 2 times
        return getHighAccuracyLocation(retryCount + 1);
      }
      throw error;
    } finally {
      setIsLocationLoading(false);
    }
  };

  const reverseGeocodeWithFallback = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResult.length > 0) {
        const addr = addressResult[0];
        return [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
          addr.country,
        ]
          .filter(Boolean)
          .join(", ");
      }
      return `${toDMS(latitude, true)}, ${toDMS(longitude, false)}`;
    } catch (error) {
      console.warn("Geocoding failed:", error);
      return "Address unavailable";
    }
  };

  const takePicture = async () => {
    const cam = cameraRef.current;
    if (!cam) {
      console.warn("Camera ref is null");
      return;
    }

    try {
      // Capture photo first
      const captured = await cam.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      });

      if (!captured?.uri) {
        Alert.alert("Capture failed", "No URI returned from camera");
        return;
      }

      // Check and request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera and location permissions are needed"
        );
        return;
      }

      // Get high accuracy location
      const location = await getHighAccuracyLocation();
      const accuracy = location.coords.accuracy;

      // Warn user if accuracy is poor
      if (accuracy != null && accuracy > 50) {
        const useAnyway = await new Promise((resolve) => {
          Alert.alert(
            "Location Accuracy Notice",
            `Your location accuracy is approximately ${Math.round(
              accuracy
            )} meters. ` +
              "For better results, move to an open area or wait a moment.",
            [
              { text: "Use Anyway", onPress: () => resolve(true) },
              { text: "Retry", onPress: () => resolve(false), style: "cancel" },
            ]
          );
        });

        if (!useAnyway) {
          return; // User chose to retry
        }
      }

      // Process coordinates
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Get formatted address
      const fullAddress = await reverseGeocodeWithFallback(
        location.coords.latitude,
        location.coords.longitude
      );

      // Update state
      setAddress(fullAddress);
      setTimestamp(new Date().toISOString());
      setPhoto(captured);

      console.log("Successful capture:", {
        uri: captured.uri,
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
        address: fullAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Location capture failed";
      console.error("Capture error:", errorMessage);
      setLocationError(errorMessage);
      Alert.alert("Error", errorMessage);
    }
  };
  const handleUsePhoto = async () => {
    const userId = session?.user.id;
    if (!photo || !coords || !timestamp || !userId) {
      Alert.alert(
        "Missing data",
        "Photo, location, timestamp, or user ID missing."
      );
      return;
    }

    try {
      // Persist the photo before navigating
      const newPath = `${FileSystem.documentDirectory}${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: photo.uri,
        to: newPath,
      });

      // console.log("✅ Saved photo to:", newPath);

      router.push({
        pathname: "/clerk/cdashboard/WriteDescription",
        params: {
          photoUri: encodeURIComponent(newPath),
          description: "Field visit photo",
          userId,
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
          timestamp,
          address: address ?? "unknown address",
          status: "pending",
        },
      });

      setPhoto(null);
      setCoords(null);
      setAddress(null);
    } catch (err) {
      console.error("File copy failed", err);
      Alert.alert("Error", "Failed to save photo.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingBottom: insets.bottom + 50}]}
    >
      {photo ? (
        <View style={styles.previewContainer}>
          {/* Preview Mode */}
          <Image
            source={{ uri: photo.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          {/* Location Info Card */}
          {coords && (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color="#3b82f6" />
                <Text style={styles.locationTitle}>Location Details</Text>
              </View>

              <View style={styles.coordinateRow}>
                <View style={styles.coordinateBox}>
                  <Text style={styles.coordinateLabel}>Latitude</Text>
                  <Text style={styles.coordinateValue}>
                    {coords.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.coordinateBox}>
                  <Text style={styles.coordinateLabel}>Longitude</Text>
                  <Text style={styles.coordinateValue}>
                    {coords.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>

              {address && (
                <View style={styles.addressRow}>
                  <Ionicons name="map" size={16} color="#64748b" />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {address}
                  </Text>
                </View>
              )}

              <View style={styles.timestampRow}>
                <Ionicons name="time" size={16} color="#64748b" />
                <Text style={styles.timestampText}>{new Date(timestamp).toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setPhoto(null);
                setCoords(null);
              }}
            >
              <Ionicons name="close" size={20} color="#ef4444" />
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUsePhoto}
            >
              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Use Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          {/* Camera Mode */}
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.cameraControls}>
              <View style={styles.locationStatusContainer}>
                {isLocationLoading && (
                  <View style={styles.statusBubble}>
                    <Ionicons name="location" size={16} color="white" />
                    <Text style={styles.statusText}>Getting location...</Text>
                  </View>
                )}

                {locationAccuracy !== null && (
                  <View style={styles.statusBubble}>
                    <Ionicons
                      name={
                        locationAccuracy <= 30 ? "checkmark-circle" : "warning"
                      }
                      size={16}
                      color={locationAccuracy <= 30 ? "#4CAF50" : "#FFC107"}
                    />
                    <Text style={styles.statusText}>
                      Accuracy: ~{Math.round(locationAccuracy)}m
                    </Text>
                  </View>
                )}

                {locationError && (
                  <View
                    style={[
                      styles.statusBubble,
                      { backgroundColor: "#F44336" },
                    ]}
                  >
                    <Ionicons name="warning" size={16} color="white" />
                    <Text style={styles.statusText}>{locationError}</Text>
                  </View>
                )}
              </View>
              {/* Flip Button */}
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleFacing}
              >
                <Ionicons name="camera-reverse" size={28} color="white" />
              </TouchableOpacity>

              {/* Capture Button */}
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>

              {/* Helper Text */}
              <Text style={styles.helperText}>
                Align your subject within the frame
              </Text>
            </View>
          </CameraView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  // ===== Base Styles =====
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ===== Preview Mode Styles =====
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    flex: 1,
    width: "100%",
  },
  locationCard: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  coordinateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  coordinateBox: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 8,
    flex: 1,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestampText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 8,
  },
  actionButtons: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primaryButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },

  // ===== Camera Mode Styles =====
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  flipButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    padding: 12,
  },
  captureButtonContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  locationStatusContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  statusBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: "white",
    marginLeft: 6,
    fontSize: 12,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontSize: 14,
    marginTop: 20,
  },

  // ===== Permission Styles =====
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#1e293b",
  },
});
