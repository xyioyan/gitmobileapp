import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Button,
  Alert,
} from "react-native";
// import { isImageBlurry } from "../../services/imageBlurCheck";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  type CameraCapturedPicture,
} from "expo-camera";
import * as Location from "expo-location";
// import { supabase } from "../../services/supabaseClient";
import { useAuth } from "@/provider/AuthProvider";
import { router } from "expo-router";

export default function CaptureVisitScreen() {
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
  const [timestamp, setTimestamp] = useState<string | null>(null);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
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

  const takePicture = async () => {
    const cam = cameraRef.current;
    if (!cam) {
      console.warn("Camera ref is null");
      return;
    }

    try {
      const captured = await cam.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      });

      console.log("📸 Captured Photo URI:", captured?.uri);
      if (!captured?.uri) {
        Alert.alert("Capture failed", "No URI returned from camera");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Error", "Permission not granted.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const latitudeDMS = toDMS(location.coords.latitude, true);
      const longitudeDMS = toDMS(location.coords.longitude, false);
      console.log("Formatted GeoTag:", `${latitudeDMS} ${longitudeDMS}`);

      const addressResult = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      let fullAddress = "";
      if (addressResult.length > 0) {
        const { name, street, city, region, postalCode, country } =
          addressResult[0];
        fullAddress = `${name ?? ""}, ${street ?? ""}, ${city ?? ""}, ${
          region ?? ""
        } ${postalCode ?? ""}, ${country ?? ""}`;
      }

      setAddress(fullAddress);
      setTimestamp(new Date().toISOString());
      setPhoto(captured);
    } catch (err) {
      console.error("takePictureAsync error:", err);
      Alert.alert("Error", "Could not take photo or get location.");
    }
  };

  const handleUsePhoto = () => {
    const userId = session?.user.id;
    if (!photo || !coords || !timestamp || !userId) {
      Alert.alert(
        "Missing data",
        "Photo, location, timestamp, or user ID missing."
      );
      return;
    } else {
      try {
        console.log("Use Photo.");
        router.push({
          pathname: "/(auth)/clerk/WriteDescription",
          params: {
            photoUri: photo.uri,
            description: "Field visit photo",
            userId,
            latitude: coords.latitude.toString(),
            longitude: coords.longitude.toString(),
            timestamp,
            address: address ?? "unknown address",
            status: "pending",
          },
        });
        console.log(photo.uri)
        setPhoto(null);
        setCoords(null);
        setAddress(null);
      } catch (err) {
        console.error("Local save failed", err);
        Alert.alert("Error", "Failed to save visit locally.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          {coords && (
            <Text style={{ color: "#fff", textAlign: "center", marginTop: 10 }}>
              Lat: {coords.latitude.toFixed(4)}, Lon:{" "}
              {coords.longitude.toFixed(4)}, Address: {address}, time:{" "}
              {timestamp}
            </Text>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setPhoto(null);
                setCoords(null);
              }}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleUsePhoto}
            >
              <Text style={styles.buttonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
              <Text style={styles.flipText}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: { fontSize: 18, textAlign: "center", marginBottom: 20 },
  camera: { flex: 1 },
  controls: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "transparent",
  },
  flipButton: {
    alignSelf: "flex-end",
    padding: 12,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  flipText: { color: "#fff" },
  captureButton: {
    alignSelf: "flex-end",
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    height: 72,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  preview: { flex: 1, resizeMode: "contain" },
  buttonRow: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  retakeButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 15,
    borderRadius: 10,
  },
  acceptButton: {
    backgroundColor: "rgba(0,255,0,0.5)",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
